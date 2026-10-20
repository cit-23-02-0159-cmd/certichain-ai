import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const { ethers } = await network.connect();

  const [owner, institution] = await ethers.getSigners();

  console.log("Contract owner:", owner.address);
  console.log("Institution wallet:", institution.address);

  const certiChainRegistry = await ethers.getContractAt(
    "CertiChainRegistry",
    CONTRACT_ADDRESS,
    owner
  );

  console.log("Registering SLTC Research University...");

  const transaction =
    await certiChainRegistry.registerInstitution(
      institution.address,
      "SLTC Research University"
    );

  await transaction.wait();

  console.log("Institution registered successfully!");
  console.log("Institution:", "SLTC Research University");
  console.log("Wallet:", institution.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});