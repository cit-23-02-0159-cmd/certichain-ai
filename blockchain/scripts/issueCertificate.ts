import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const { ethers } = await network.connect();

  const [, institution] = await ethers.getSigners();

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
    CONTRACT_ADDRESS,
    institution
  );

  console.log("Issuing certificate...");
  console.log("Certificate ID:", certificateId);
  console.log("Student:", studentName);
  console.log("Document hash:", documentHash);

  const transaction =
    await certiChainRegistry.issueCertificate(
      certificateId,
      studentName,
      qualification,
      documentHash
    );

  await transaction.wait();

  console.log("Certificate issued successfully!");
  console.log("Transaction hash:", transaction.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});