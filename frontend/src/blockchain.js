import { ethers } from "ethers";







export const CONTRACT_ADDRESS =



  "0x5FbDB2315678afecb367f032d93F642f64180aa3";







const LOCAL_RPC_URL = "http://127.0.0.1:8545";



const LOCAL_CHAIN_ID = "0x7A69"; // 31337







export const CONTRACT_ABI = [



  "function getCertificate(string certificateId) view returns (tuple(string certificateId,string studentName,string qualification,string institutionName,bytes32 documentHash,address issuedBy,address institutionWallet,uint256 issuedAt,bool revoked,bool exists,uint256 updatedAt,uint256 version,uint8 status,string revokeReason,string previousCertificateId,string supersededBy))",







  "function verifyCertificate(string certificateId, bytes32 documentHash) view returns (bool isValid, bool isRevoked, string institutionName)",







  "function totalCertificates() view returns (uint256)",



  "function totalInstitutions() view returns (uint256)",







  "function checkInstitution(address institutionWallet) view returns (string institutionName, bool verified)",







  "function getInstitutionStatus(address institutionWallet) view returns (uint8)",







  "function getCertificateStatus(string certificateId) view returns (uint8)",







  "function getCertificateIdByHash(bytes32 documentHash) view returns (string)",







  "function staffInstitution(address staffWallet) view returns (address)",







  "function issueCertificate(string certificateId,string studentName,string qualification,bytes32 documentHash)",







  "function revokeCertificate(string certificateId)",







  "function revokeCertificateWithReason(string certificateId,string reason)",







  "function reissueCertificate(string oldCertificateId,string newCertificateId,string studentName,string qualification,bytes32 newDocumentHash)",



];







const provider = new ethers.JsonRpcProvider(



  LOCAL_RPC_URL



);







export const certiChainContract = new ethers.Contract(



  CONTRACT_ADDRESS,



  CONTRACT_ABI,



  provider



);







const certificateStatusNames = [



  "None",



  "Active",



  "Revoked",



  "Superseded",



];







const institutionStatusNames = [



  "None",



  "Pending",



  "Verified",



  "Suspended",



  "Revoked",



];







function formatCertificate(certificate) {



  const statusNumber = Number(



    certificate.status



  );







  return {



    certificateId:



      certificate.certificateId,







    studentName:



      certificate.studentName,







    qualification:



      certificate.qualification,







    institutionName:



      certificate.institutionName,







    documentHash:



      certificate.documentHash,







    issuedBy:



      certificate.issuedBy,







    institutionWallet:



      certificate.institutionWallet,







    issuedAt:



      new Date(



        Number(certificate.issuedAt) * 1000



      ).toLocaleString(),







    revoked:



      certificate.revoked,







    exists:



      certificate.exists,







    updatedAt:



      Number(certificate.updatedAt) > 0



        ? new Date(



            Number(certificate.updatedAt) *



              1000



          ).toLocaleString()



        : "",







    version:



      Number(certificate.version),







    status:



      statusNumber,







    statusName:



      certificateStatusNames[



        statusNumber



      ] || "Unknown",







    revokeReason:



      certificate.revokeReason,







    previousCertificateId:



      certificate.previousCertificateId,







    supersededBy:



      certificate.supersededBy,



  };



}







export async function calculateFileHash(



  file



) {



  const fileBuffer =



    await file.arrayBuffer();







  return ethers.sha256(



    new Uint8Array(fileBuffer)



  );



}







export async function getCertificateFromBlockchain(



  certificateId



) {



  try {



    const cleanCertificateId =



      certificateId



        .trim()



        .toUpperCase();







    const certificate =



      await certiChainContract.getCertificate(



        cleanCertificateId



      );







    return formatCertificate(



      certificate



    );



  } catch (error) {



    console.error(



      "Blockchain certificate error:",



      error



    );







    throw new Error(



      "Certificate not found on the blockchain."



    );



  }



}







export async function verifyUploadedCertificate(



  certificateId,



  file



) {



  try {



    const cleanCertificateId =



      certificateId



        .trim()



        .toUpperCase();







    const uploadedFileHash =



      await calculateFileHash(file);







    const blockchainCertificate =



      await certiChainContract.getCertificate(



        cleanCertificateId



      );







    const verificationResult =



      await certiChainContract.verifyCertificate(



        cleanCertificateId,



        uploadedFileHash



      );







    const certificate =



      formatCertificate(



        blockchainCertificate



      );







    const blockchainHash =



      blockchainCertificate.documentHash;







    const hashMatched =



      blockchainHash.toLowerCase() ===



      uploadedFileHash.toLowerCase();







    return {



      certificate,







      uploadedFileHash,







      blockchainHash,







      hashMatched,







      isValid:



        verificationResult[0],







      isRevoked:



        verificationResult[1],







      institutionName:



        verificationResult[2],



    };



  } catch (error) {



    console.error(



      "Certificate verification error:",



      error



    );







    throw new Error(



      "Unable to verify the uploaded certificate."



    );



  }



}







async function switchToLocalBlockchain() {



  if (!window.ethereum) {



    throw new Error(



      "MetaMask is not installed."



    );



  }







  try {



    await window.ethereum.request({



      method: "wallet_switchEthereumChain",



      params: [



        {



          chainId: LOCAL_CHAIN_ID,



        },



      ],



    });



  } catch (error) {



    if (error.code === 4902) {



      await window.ethereum.request({



        method: "wallet_addEthereumChain",



        params: [



          {



            chainId:



              LOCAL_CHAIN_ID,







            chainName:



              "Hardhat Local",







            nativeCurrency: {



              name: "Ether",



              symbol: "ETH",



              decimals: 18,



            },







            rpcUrls: [



              LOCAL_RPC_URL,



            ],



          },



        ],



      });







      return;



    }







    throw error;



  }



}







export async function connectWallet() {



  await switchToLocalBlockchain();







  const browserProvider =



    new ethers.BrowserProvider(



      window.ethereum



    );







  await browserProvider.send(



    "eth_requestAccounts",



    []



  );







  const signer =



    await browserProvider.getSigner();







  const address =



    await signer.getAddress();







  const institutionWallet =



    await certiChainContract.staffInstitution(



      address



    );







  let institution = null;







  if (



    institutionWallet !==



    ethers.ZeroAddress



  ) {



    const institutionDetails =



      await certiChainContract.checkInstitution(



        institutionWallet



      );







    const institutionStatus =



      await certiChainContract.getInstitutionStatus(



        institutionWallet



      );







    institution = {



      wallet:



        institutionWallet,







      name:



        institutionDetails[0],







      verified:



        institutionDetails[1],







      status:



        Number(



          institutionStatus



        ),







      statusName:



        institutionStatusNames[



          Number(institutionStatus)



        ] || "Unknown",



    };



  }







  return {



    provider:



      browserProvider,







    signer,







    address,







    institution,



  };



}







export async function issueCertificateOnBlockchain({



  certificateId,



  studentName,



  qualification,



  file,



}) {



  if (!file) {



    throw new Error(



      "Certificate PDF is required."



    );



  }







  const cleanCertificateId =



    certificateId



      .trim()



      .toUpperCase();







  const documentHash =



    await calculateFileHash(file);







  const wallet =



    await connectWallet();







  if (!wallet.institution) {



    throw new Error(



      "This wallet is not registered with an institution."



    );



  }







  if (



    wallet.institution.status !== 2



  ) {



    throw new Error(



      `Institution status is ${wallet.institution.statusName}.`



    );



  }







  const contract =



    new ethers.Contract(



      CONTRACT_ADDRESS,



      CONTRACT_ABI,



      wallet.signer



    );







  const transaction =



    await contract.issueCertificate(



      cleanCertificateId,



      studentName.trim(),



      qualification.trim(),



      documentHash



    );







  const receipt =



    await transaction.wait();







  return {



    certificateId:



      cleanCertificateId,







    documentHash,







    transactionHash:



      transaction.hash,







    blockNumber:



      receipt.blockNumber,







    institution:



      wallet.institution,







    walletAddress:



      wallet.address,



  };



}







export async function revokeCertificateOnBlockchain(



  certificateId,



  reason



) {



  const wallet =



    await connectWallet();







  const contract =



    new ethers.Contract(



      CONTRACT_ADDRESS,



      CONTRACT_ABI,



      wallet.signer



    );







  const transaction =



    await contract.revokeCertificateWithReason(



      certificateId



        .trim()



        .toUpperCase(),







      reason.trim()



    );







  const receipt =



    await transaction.wait();







  return {



    transactionHash:



      transaction.hash,







    blockNumber:



      receipt.blockNumber,



  };



}







export async function getBlockchainStatus() {



  try {



    const blockNumber =



      await provider.getBlockNumber();







    const totalCertificates =



      await certiChainContract.totalCertificates();







    const totalInstitutions =



      await certiChainContract.totalInstitutions();







    return {



      connected: true,







      blockNumber,







      totalCertificates:



        Number(



          totalCertificates



        ),







      totalInstitutions:



        Number(



          totalInstitutions



        ),







      contractAddress:



        CONTRACT_ADDRESS,



    };



  } catch (error) {



    console.error(



      "Blockchain connection error:",



      error



    );







    return {



      connected: false,



      blockNumber: 0,



      totalCertificates: 0,



      totalInstitutions: 0,



      contractAddress:



        CONTRACT_ADDRESS,



    };



  }



}
