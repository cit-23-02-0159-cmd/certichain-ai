import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const { ethers } = await network.connect();

  const certificateId = "CCA-2026-0159";
  const studentName = "Volga Indeewari Gunasekara";
  const qualification = "BSc (Hons) Software Engineering";

  const certificateData =
    `${certificateId}-${studentName}-${qualification}`;

  const documentHash = ethers.sha256(
    ethers.toUtf8Bytes(certificateData)
  );

  const certiChainRegistry = await ethers.getContractAt(
    "CertiChainRegistry",
    CONTRACT_ADDRESS
  );

  console.log("Checking certificate on blockchain...");

  const result = await certiChainRegistry.verifyCertificate(
    certificateId,
    documentHash
  );

  const certificate =
    await certiChainRegistry.getCertificate(certificateId);

  console.log("\n----- CERTIFICATE RESULT -----");
  console.log("Certificate ID:", certificate.certificateId);
  console.log("Student:", certificate.studentName);
  console.log("Qualification:", certificate.qualification);
  console.log("Institution:", certificate.institutionName);
  console.log("Document Hash:", certificate.documentHash);
  console.log("Issued By:", certificate.issuedBy);
  console.log(
    "Issue Date:",
    new Date(
      Number(certificate.issuedAt) * 1000
    ).toLocaleString()
  );
  console.log("Revoked:", certificate.revoked);
  console.log("Valid:", result.isValid);
  console.log("------------------------------");

  if (result.isValid) {
    console.log("Certificate verification PASSED!");
  } else {
    console.log("Certificate verification FAILED!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});