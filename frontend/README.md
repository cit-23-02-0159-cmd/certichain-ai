# CertiChain AI - Academic Certificate Verification System

An end-to-end blockchain-based academic certificate issuance and automated verification platform featuring SHA-256 cryptographic hashing, PDF QR-code embedding, and AI-driven document integrity checks.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React.js (Vite), React Router, Ethers.js / Web3
- **Backend API:** Node.js, Express.js, JSON / SQLite Storage
- **Blockchain:** Ethereum Local Network (Hardhat Node, Solidity Smart Contract)
- **PDF Processing:** `pdf-lib` (Dynamic QR Code Stamping), `qrcode`
- **Security:** SHA-256 Hashing for Tamper Detection

---

## 🚀 How to Run the Project Locally

### 1. Start Local Blockchain Node
```bash
cd blockchain
npx hardhat node