# WalrusSign

WalrusSign is a decentralized document-signing application built for the Sui and Walrus stack. It lets a user upload a PDF, hash it locally in the browser, store the file on Walrus, and record the document reference and signatures on Sui through a Move smart contract. The result is a tamper-resistant signing workflow with no centralized backend.

## What It Does

WalrusSign follows the flow described in `ARCHITECTURE.md`:

1. The creator uploads a PDF in the frontend.
2. The app computes a SHA-256 hash locally before any blockchain interaction.
3. The PDF is uploaded to Walrus and returns a blob ID.
4. The blob ID and hash are written to the Sui Move contract.
5. The recipient opens the share link and fetches the PDF from Walrus.
6. The recipient verifies the downloaded file against the on-chain hash.
7. The recipient signs the document through their wallet, and the signature is recorded on Sui.

This keeps the document contents off-chain while preserving a permanent, verifiable record of the signing process.

## Architecture Diagram

```mermaid
graph TD
    UserA((Party A<br/>Creator))
    UserB((Party B<br/>Signer))

    subgraph "WalrusSign dApp (Client-Side)"
        React[React / Vite Frontend]
        DappKit["mysten dapp-kit<br/>Wallet Adapter"]
        LocalHash[Local SHA-256<br/>Hasher]
    end

    subgraph "Walrus Storage Network"
        Publisher[Walrus Publisher Node]
        Aggregator[Walrus Aggregator Node]
    end

    subgraph "Sui Blockchain"
        SmartContract[WalrusSign Move Contract]
        DocObject[(On-Chain Document Object<br/>Blob ID, Hash, Signatures)]
    end

    UserA -->|1. Uploads PDF| React
    React -->|2. Computes Hash| LocalHash
    React -->|3. POST raw binary| Publisher
    Publisher -.->|Returns Blob ID| React

    React -->|4. Sign Transaction| DappKit
    DappKit -->|5. Execute create_document| SmartContract
    SmartContract -->|Creates| DocObject

    UserB -->|6. Opens Link| React
    React -->|7. Fetch via Blob ID| Aggregator
    Aggregator -.->|Returns PDF bytes| React
    React -->|8. Re-computes & Verifies Hash| DocObject

    UserB -->|9. Sign Transaction| DappKit
    DappKit -->|10. Execute sign| SmartContract
    SmartContract -->|Mutates State| DocObject
```

## Workflow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor PartyA as Party A
    participant App as WalrusSign dApp
    participant Walrus as Walrus Network
    participant Sui as Sui Blockchain
    actor PartyB as Party B

    PartyA->>App: Drag & Drop PDF Contract
    App->>App: Compute SHA-256 Hash Locally

    Note over App,Walrus: Phase 1: Decentralized Storage
    App->>Walrus: Upload raw PDF bytes (Publisher)
    Walrus-->>App: Return immutable blob_id

    Note over App,Sui: Phase 2: On-Chain Minting
    App->>Sui: Call create_document(blob_id, hash, party_b)
    Sui-->>Sui: Mint shared Document object
    Sui-->>App: Return object_id

    App->>PartyA: Display Shareable Link
    PartyA->>PartyB: Send Link via Email/Chat

    Note over PartyB,Sui: Phase 3: Verification & Signing
    PartyB->>App: Open Signing Link
    App->>Sui: Fetch Document object state
    App->>Walrus: Fetch raw PDF bytes via blob_id
    Walrus-->>App: Return PDF
    App->>App: Recompute SHA-256 of downloaded PDF
    App->>App: Verify downloaded hash == on-chain hash
    PartyB->>App: Click Sign Document
    App->>Sui: Call sign(document_object)
    Sui-->>Sui: Lock document and record timestamp

    Sui-->>App: Transaction Success
    App->>PartyB: Display Fully Executed
```

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Storage: Walrus decentralized storage
- Blockchain: Sui
- Smart contract: Move
- Wallet integration: `@mysten/dapp-kit`

## Repository Layout

- `app/` contains the React frontend.
- `contract/` contains the Move package and contract source.
- `deploy.ps1` helps publish the contract and update the app environment.
- `ARCHITECTURE.md` contains the full diagrams and workflow details.

## Setup

```bash
cd app
npm install
npm run dev
```

Create `app/.env` with your Walrus and Sui values:

```env
VITE_WALRUS_PUBLISHER=your_walrus_publisher_url
VITE_WALRUS_AGGREGATOR=your_walrus_aggregator_url
VITE_TATUM_RPC=your_sui_rpc_url
VITE_TATUM_KEY=your_tatum_api_key
VITE_PACKAGE_ID=0x_your_move_package_id
```

## Summary

WalrusSign demonstrates a privacy-preserving, decentralized signing flow where the file stays on Walrus and the proof of signing stays on Sui. The architecture is intentionally simple for judges to follow and strong enough to verify document integrity end-to-end.