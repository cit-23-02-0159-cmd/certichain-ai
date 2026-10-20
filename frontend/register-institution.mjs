import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Hardhat Account #0 (contract owner)
const owner = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);

const contract = new ethers.Contract(
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  [
    "function registerInstitution(address,string)",
    "function checkInstitution(address) view returns (string,bool)",
  ],
  owner
);

// Hardhat Account #1 (MetaMask wallet)
const institutionWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const tx = await contract.registerInstitution(
  institutionWallet,
  "SLTC Research University"
);
await tx.wait();

console.log("Registered:", await contract.checkInstitution(institutionWallet));