# WalrusSign

WalrusSign is a decentralized document-signing application built with React, Vite, TypeScript, Walrus, and Sui. It lets a user upload a PDF, compute a SHA-256 hash locally in the browser, store the document on Walrus, and record the document reference and signatures on-chain through a Move contract. The result is a tamper-resistant signing flow with no centralized backend.

## What It Does

WalrusSign follows the architecture described in `../ARCHITECTURE.md`:

1. A creator uploads a PDF in the frontend.
2. The app computes the document hash locally before any blockchain interaction.
3. The PDF is stored on Walrus and returns a blob ID.
4. The blob ID and hash are written to the Sui Move contract.
5. A recipient opens the shared link, fetches the PDF from Walrus, and verifies it against the on-chain hash.
6. The recipient signs the document through their wallet, and the signature is recorded on Sui.

This keeps the document content off-chain while preserving a permanent, verifiable record of the signature workflow.

## Key Features

- Client-side hashing for privacy and integrity.
- Decentralized PDF storage through Walrus.
- On-chain document state and signature records through Sui.
- Wallet-based interaction with `@mysten/dapp-kit`.
- No backend server required for the core signing flow.
- Verification-first design so the downloaded PDF can be checked against the chain before signing.

## Architecture Summary

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Storage: Walrus for document blobs
- Blockchain: Sui for document state and signatures
- Smart contract: Move contract under `contract/`
- UI flow: upload, hash, store, verify, sign

## Setup

### Prerequisites

- Node.js 18+
- A Sui wallet
- Walrus and Sui endpoints configured in `app/.env`
- Sui CLI only if you want to redeploy or update the Move contract

### Install and Run

```bash
cd app
npm install
npm run dev
```

### Environment Variables

Create or update `app/.env` with the values used by the frontend:

```env
VITE_WALRUS_PUBLISHER=your_walrus_publisher_url
VITE_WALRUS_AGGREGATOR=your_walrus_aggregator_url
VITE_TATUM_RPC=your_sui_rpc_url
VITE_TATUM_KEY=your_tatum_api_key
VITE_PACKAGE_ID=0x_your_move_package_id
```

## Project Structure

- `app/` contains the React frontend.
- `app/src/lib/sui.ts` contains the Walrus and Sui integration helpers.
- `app/src/main.tsx` sets up the app and wallet/network behavior.
- `contract/` contains the Move package and contract sources.
- `ARCHITECTURE.md` contains the full workflow and Mermaid diagrams.

## Submission Notes

WalrusSign is designed as a hackathon-ready demonstration of decentralized signing. The README focuses on the actual user flow, the storage and verification model, and the reason the architecture is trustworthy: the file stays on Walrus, while Sui stores the immutable proof of the transaction.

*Built for the Tatum x Walrus Hackathon*
