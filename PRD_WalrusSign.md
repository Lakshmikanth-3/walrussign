# PRD — WalrusSign
### Decentralized Document Signing on Sui + Walrus
**Hackathon:** Tatum x Build on Sui with Walrus  
**Prize Targets:** Best Walrus Integration ($200) · Best Use of Tatum Tools ($200) · Top 3 Placement ($300–$600)  
**Deadline:** June 6, 2025 · 17:00 UTC  
**Team Size:** 1–3  
**Chain:** Sui Mainnet  

---

## 1. Problem Statement

Every e-signature tool today — DocuSign, HelloSign, Adobe Sign — is centralized. They can lose your data, get hacked, change their pricing, or simply shut down. When they do, your signed contracts disappear.

WalrusSign stores the actual document blob on Walrus decentralized storage and writes both parties' signatures as Sui blockchain transactions. The result is tamper-proof, permanently verifiable, server-free document signing — with zero dependency on any company staying alive.

**One-liner for the demo:** "DocuSign, but the contract lives forever on the blockchain and no company can take it down."

---

## 2. Core Features (MVP — 24hr scope)

| Feature | Description |
|---|---|
| Upload document | User uploads PDF/doc, file is stored on Walrus, blob ID returned |
| On-chain document object | Walrus blob ID + SHA-256 hash stored in Sui Move object via Tatum RPC |
| Shareable signing link | Link contains Sui object ID — recipient fetches doc from Walrus directly |
| Two-party signing | Both parties sign via Sui wallet transaction — contract immutably records both |
| Verification certificate | Public page showing both signer addresses, timestamps, SuiScan tx links |
| AI assistant (MCP bonus) | Tatum MCP lets AI explain "what does this contract say?" before signing |

---

## 3. User Flow

```
[Party A]
  │
  ├─ Connects Sui wallet (Suiet)
  ├─ Uploads PDF → Walrus blob upload (Tatum RPC)
  ├─ Walrus returns blob_id
  ├─ Calls create_document(blob_id, sha256_hash, party_b_address) on Sui
  ├─ Gets shareable link: walrussign.app/sign/{object_id}
  │
[Party B opens link]
  │
  ├─ Fetches doc from Walrus (blob_id retrieved from Sui object)
  ├─ Renders PDF in browser (no server!)
  ├─ Connects wallet → clicks Sign
  ├─ Sui tx: sign(document_object_id)
  │
[Both signed → contract LOCKED on-chain]
  │
  └─ Certificate page: addresses · timestamps · SuiScan links · Walrus blob URL
```

---

## 4. Smart Contract — Move

```move
module walrussign::document {
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};
  use std::string::{Self, String};
  use sui::clock::{Self, Clock};

  const E_ALREADY_SIGNED: u64 = 1;
  const E_NOT_PARTY:       u64 = 2;

  struct Document has key, store {
    id:             UID,
    walrus_blob_id: String,     // Walrus blob ID of the document
    doc_hash:       vector<u8>, // SHA-256 of original file
    party_a:        address,
    party_b:        address,
    signed_a:       bool,
    signed_b:       bool,
    signed_at:      u64,        // Sui clock timestamp (ms) when both signed
    locked:         bool,
  }

  public fun create_document(
    blob_id:  String,
    hash:     vector<u8>,
    party_b:  address,
    ctx:      &mut TxContext
  ) {
    let doc = Document {
      id:             object::new(ctx),
      walrus_blob_id: blob_id,
      doc_hash:       hash,
      party_a:        tx_context::sender(ctx),
      party_b,
      signed_a:       false,
      signed_b:       false,
      signed_at:      0,
      locked:         false,
    };
    transfer::share_object(doc);
  }

  public fun sign(
    doc:   &mut Document,
    clock: &Clock,
    ctx:   &mut TxContext
  ) {
    assert!(!doc.locked, E_ALREADY_SIGNED);
    let signer = tx_context::sender(ctx);
    assert!(signer == doc.party_a || signer == doc.party_b, E_NOT_PARTY);

    if (signer == doc.party_a) { doc.signed_a = true; }
    else                       { doc.signed_b = true; };

    if (doc.signed_a && doc.signed_b) {
      doc.locked    = true;
      doc.signed_at = clock::timestamp_ms(clock);
    };
  }
}
```

**Deploy command:**
```bash
sui client publish --gas-budget 100000000 --skip-dependency-verification
```

---

## 5. Frontend — Key Code Snippets

### Walrus Upload via Tatum RPC

```typescript
const TATUM_KEY  = process.env.NEXT_PUBLIC_TATUM_KEY;
const WALRUS_PUB = "https://publisher.walrus-testnet.walrus.space";
const TATUM_RPC  = "https://sui-mainnet.gateway.tatum.io";

// Upload document blob to Walrus
export async function uploadToWalrus(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const res = await fetch(`${WALRUS_PUB}/v1/blobs?epochs=5`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: buf,
  });
  const data = await res.json();
  return data.newlyCreated?.blobObject?.blobId
      ?? data.alreadyCertified?.blobId;
}

// All Sui calls go through Tatum
export async function suiRpc(method: string, params: unknown[]) {
  const res = await fetch(TATUM_RPC, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TATUM_KEY!,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await res.json()).result;
}

// SHA-256 hash for on-chain verification
export async function hashFile(file: File): Promise<Uint8Array> {
  const buf  = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return new Uint8Array(hash);
}
```

### Fetch + Render Document from Walrus

```typescript
const WALRUS_AGG = "https://aggregator.walrus-testnet.walrus.space";

export async function fetchFromWalrus(blobId: string): Promise<Blob> {
  const res = await fetch(`${WALRUS_AGG}/v1/blobs/${blobId}`);
  return res.blob();
}

// In React component:
const blob   = await fetchFromWalrus(blobId);
const url    = URL.createObjectURL(blob);
// <iframe src={url} /> — renders PDF directly from Walrus, no server
```

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Sui Mainnet |
| RPC Provider | Tatum (`https://sui-mainnet.gateway.tatum.io`) |
| Decentralized Storage | Walrus (blob upload + retrieval) |
| Smart Contract | Move (Sui) |
| Frontend | Next.js 14 + TypeScript |
| Wallet | Suiet wallet adapter |
| AI (bonus) | Tatum MCP server |
| Deployment | Vercel (frontend) + Sui Mainnet (contract) |

---

## 7. Pages / Routes

```
/                   → Landing: "Sign contracts on-chain"
/upload             → Upload doc, enter party B address, deploy contract
/sign/[objectId]    → Fetch doc from Walrus, render PDF, sign button
/verify/[objectId]  → Certificate: both signers, timestamps, SuiScan links
```

---

## 8. 24-Hour Build Timeline

| Hours | Task |
|---|---|
| 0–1 | Setup: Tatum API key, Sui wallet, scaffold Next.js, install @mysten/sui.js + Suiet |
| 1–5 | Write + test Move contract, deploy to testnet, save package ID |
| 5–9 | Walrus upload integration, Tatum RPC calls, hashFile utility |
| 9–16 | Build 3 frontend pages (upload, sign, verify certificate) |
| 16–20 | Switch to Mainnet, add Tatum MCP AI feature |
| 20–22 | Write README with setup guide, architecture diagram |
| 22–24 | Record 2:30 demo video, submit |

---

## 9. Demo Video Script (2 min 30 sec)

1. **0:00–0:20** — Hook: "What if contracts never needed a lawyer's server?"
2. **0:20–0:50** — Upload PDF → Walrus blob ID appears → Sui tx via Tatum RPC confirms
3. **0:50–1:30** — Open link in incognito (second wallet) → doc loads from Walrus → sign → wallet confirm
4. **1:30–2:00** — Certificate page: both addresses, timestamps, live SuiScan link
5. **2:00–2:30** — Show code: Tatum RPC call, Walrus upload function, Move contract, MCP usage

---

## 10. Judging Criteria Alignment

| Criterion | Weight | How WalrusSign wins |
|---|---|---|
| Walrus + Tatum Integration | 30% | Walrus stores actual doc blobs (not hashes). Every RPC call uses Tatum. MCP used for AI. |
| Technical Quality | 30% | Clean Move contract, TypeScript frontend, proper error handling, testnet + mainnet deploy |
| Creativity | 20% | First document signing protocol on Sui — no competitor exists on this chain |
| Presentation | 20% | Tight demo video, clean README with Walrus+Tatum integration guide |
| Bonus: Social | +extra | Post on X/LinkedIn tagging @Tatum_io @WalrusFoundation @SuiNetwork |

---

## 11. Tatum Platform Gaps — Ecosystem Contributions

Document these in your README to score extra points with Tatum judges:

- **Gap 1:** No Walrus-specific code example in Tatum docs — your README is the first reference
- **Gap 2:** Tatum MCP guide has no Walrus tool examples — your custom MCP tool fills this
- **Gap 3:** No one-command testnet setup for Walrus+Sui — add `scripts/setup.sh` to your repo

---

## 12. Pre-Submission Checklist

- [ ] Deployed on Sui **Mainnet** (not testnet)
- [ ] Walrus blob ID visible in UI and stored on-chain in Move object
- [ ] All Sui RPC calls use `https://sui-mainnet.gateway.tatum.io`
- [ ] Tatum MCP server used for at least one AI feature
- [ ] GitHub repo is public with clear README
- [ ] README explains Walrus upload flow + Tatum RPC integration with code
- [ ] Demo video shows live Mainnet transaction on SuiScan
- [ ] Posted on X/LinkedIn tagging @Tatum_io @WalrusFoundation @SuiNetwork
- [ ] Submitted via form before June 6, 17:00 UTC

---

## 13. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_TATUM_KEY=your_tatum_api_key_here
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_PACKAGE_ID=0x...  # after contract deploy
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
```

---

*Built for the Tatum x Walrus Hackathon · May 23 – June 6, 2025*  
*Store. Build. Ship.*
