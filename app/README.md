# WalrusSign

**Decentralized Document Signing on Sui + Walrus**

WalrusSign is a fully decentralized e-signature platform built for the **Tatum x Build on Sui with Walrus Hackathon**. It stores the actual document blob on Walrus decentralized storage and writes both parties' signatures as Sui blockchain transactions. The result is tamper-proof, permanently verifiable, server-free document signing — with zero dependency on any centralized company staying alive.

## 🚀 Features
- **Walrus Decentralized Storage**: PDF documents are stored natively as Walrus blobs (not just hashes).
- **On-Chain Move Contract**: Signatures and document state are recorded immutably on Sui Mainnet.
- **Tatum RPC Integration**: All blockchain reads and writes are routed through Tatum's enterprise-grade RPC Gateway.
- **Serverless**: Zero backend. The frontend fetches PDFs directly from Walrus and renders them locally.
- **Wallet Standard Integration**: Built with `@mysten/dapp-kit` for seamless wallet connectivity.

---

## 🛠️ Ecosystem Contributions (Tatum Hackathon Gaps Filled)

We built this project to also serve as a learning resource and reference implementation for the Tatum + Walrus + Sui ecosystem. We specifically addressed the following gaps in the current documentation:

### Gap 1: No Walrus-specific code example in Tatum docs
Our codebase provides a clear, production-ready reference for integrating Walrus uploads directly from a React/Next.js frontend.
See `src/lib/sui.ts` for the `uploadToWalrus` and `fetchFromWalrus` implementations.

### Gap 2: Tatum API Key Injection in `@mysten/dapp-kit`
The `@mysten/dapp-kit` `SuiClientProvider` uses standard `fetch` under the hood. We provide a clean pattern for intercepting and injecting the `x-api-key` required by Tatum RPC endpoints without breaking the library's internal logic.
See the `globalThis.fetch` override in `src/main.tsx`.

### Gap 3: No one-command testnet setup for Walrus+Sui
We've structured the `.env` template to clearly delineate Walrus publisher/aggregator endpoints and Tatum RPC endpoints, making it trivial for future developers to configure their environments.

---

## 💻 Tech Stack
- **Blockchain**: Sui Mainnet
- **RPC Provider**: [Tatum](https://tatum.io) (`https://sui-mainnet.gateway.tatum.io`)
- **Storage**: [Walrus](https://walrus.site) Decentralized Storage
- **Smart Contract**: Move (Sui)
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Wallet Integration**: `@mysten/dapp-kit`

---

## ⚙️ Setup & Local Development

### 1. Prerequisites
- Node.js 18+
- Sui CLI installed (for deploying the Move contract)
- A Tatum account and API Key ([Get one here](https://tatum.io/dashboard))
- A Sui Wallet (e.g., Suiet, Sui Wallet)

### 2. Deploy the Smart Contract
If you haven't deployed the contract yet, navigate to the `contract/` directory (create one and add the Move code from the PRD if you are doing this manually) and run:
```bash
sui client publish --gas-budget 100000000 --skip-dependency-verification
```
Note the **Package ID** from the deployment output.

### 3. Environment Configuration
Create a `.env` file in the root of the `app/` directory and fill in the values:
```env
# Your Tatum API key
VITE_TATUM_KEY=your_tatum_api_key_here

# Sui Move package ID after deploying the contract
VITE_PACKAGE_ID=0x_your_package_id_here

# Walrus endpoints (Mainnet or Testnet)
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space

# Tatum RPC endpoint for Sui Mainnet
VITE_TATUM_RPC=https://sui-mainnet.gateway.tatum.io
```

### 4. Run the Frontend
```bash
npm install
npm run dev
```

---

## 🧩 Key Code Architecture

### Walrus Integration
Documents are uploaded to Walrus directly from the client. The resulting `blobId` is stored on-chain.
```typescript
export async function uploadToWalrus(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const res = await fetch(`${WALRUS_PUB}/v1/blobs?epochs=5`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body:    buf,
  })
  const data = await res.json()
  return data.newlyCreated?.blobObject?.blobId ?? data.alreadyCertified?.blobId
}
```

### Tatum RPC Integration
All queries and transactions are sent through Tatum using a custom network configuration.
```typescript
const TATUM_RPC = import.meta.env.VITE_TATUM_RPC as string
const TATUM_KEY = import.meta.env.VITE_TATUM_KEY as string

// Injecting the required Tatum headers into fetch requests for dapp-kit
const _origFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
  if (TATUM_KEY && (url.includes('tatum.io') || url.includes('gateway.tatum'))) {
    const headers = new Headers(init?.headers)
    headers.set('x-api-key', TATUM_KEY)
    return _origFetch(input, { ...init, headers })
  }
  return _origFetch(input, init)
}
```

---
*Built for the Tatum x Walrus Hackathon · May 23 – June 6, 2025*  
*Store. Build. Ship.*
