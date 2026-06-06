import { Transaction } from '@mysten/sui/transactions'

// ─── Environment ─────────────────────────────────────────────────────────────
export const TATUM_KEY       = import.meta.env.VITE_TATUM_KEY as string
export const PACKAGE_ID      = import.meta.env.VITE_PACKAGE_ID as string
export const WALRUS_PUB      = import.meta.env.VITE_WALRUS_PUBLISHER as string
export const WALRUS_AGG      = import.meta.env.VITE_WALRUS_AGGREGATOR as string
export const TATUM_RPC       = import.meta.env.VITE_TATUM_RPC as string

// Sui Clock object (shared, always at this address on all Sui networks)
export const CLOCK_OBJECT_ID = '0x6'

// ─── SHA-256 Hash ─────────────────────────────────────────────────────────────
/**
 * Compute SHA-256 of a File and return as Uint8Array.
 * Used for on-chain document integrity verification.
 */
export async function hashFile(file: File): Promise<Uint8Array> {
  const buf  = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return new Uint8Array(hash)
}

// ─── Walrus Upload ─────────────────────────────────────────────────────────────
/**
 * Upload a file blob to Walrus decentralized storage.
 * Returns the Walrus blob ID string.
 * Stores for 5 epochs (default).
 */
export async function uploadToWalrus(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const res = await fetch(`${WALRUS_PUB}/v1/blobs?epochs=5`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body:    buf,
  })
  if (!res.ok) {
    throw new Error(`Walrus upload failed: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  const blobId =
    data.newlyCreated?.blobObject?.blobId ??
    data.alreadyCertified?.blobId
  if (!blobId) {
    throw new Error(`Walrus returned no blob ID: ${JSON.stringify(data)}`)
  }
  return blobId as string
}

// ─── Walrus Fetch ─────────────────────────────────────────────────────────────
/**
 * Fetch a blob from Walrus aggregator by blob ID.
 * Returns a Blob — use URL.createObjectURL() to render as PDF.
 */
export async function fetchFromWalrus(blobId: string): Promise<Blob> {
  const res = await fetch(`${WALRUS_AGG}/v1/blobs/${blobId}`)
  if (!res.ok) {
    throw new Error(`Walrus fetch failed: ${res.status} ${res.statusText}`)
  }
  return res.blob()
}

// ─── Tatum RPC ────────────────────────────────────────────────────────────────
/**
 * Call Sui JSON-RPC through Tatum gateway.
 * All blockchain reads go through this function.
 */
export async function suiRpc<T = unknown>(
  method: string,
  params: unknown[],
): Promise<T> {
  const res = await fetch(TATUM_RPC, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key':    TATUM_KEY,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!res.ok) {
    throw new Error(`Tatum RPC error: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (json.error) {
    throw new Error(`Sui RPC error: ${JSON.stringify(json.error)}`)
  }
  return json.result as T
}

// ─── Document Object Types ────────────────────────────────────────────────────
export interface DocumentFields {
  walrus_blob_id: string
  doc_hash:       number[]
  party_a:        string
  party_b:        string
  signed_a:       boolean
  signed_b:       boolean
  signed_at:      string   // u64 as string
  locked:         boolean
}

export interface SuiObjectResponse {
  data?: {
    objectId: string
    version:  string
    content?: {
      dataType: string
      fields:   DocumentFields
    }
  }
  error?: { code: string; message: string }
}

/**
 * Fetch a WalrusSign Document object from Sui chain via Tatum RPC.
 * Returns the parsed DocumentFields.
 */
export async function getSuiObject(objectId: string): Promise<DocumentFields> {
  const result = await suiRpc<SuiObjectResponse>('sui_getObject', [
    objectId,
    { showContent: true, showOwner: true },
  ])
  if (result.error) {
    throw new Error(`Object fetch error: ${result.error.message}`)
  }
  const content = result.data?.content
  if (!content || content.dataType !== 'moveObject') {
    throw new Error(`Object ${objectId} is not a Move object or does not exist`)
  }
  return content.fields
}

// ─── Move Transaction Builders ────────────────────────────────────────────────
/**
 * Build a Transaction to call walrussign::document::create_document.
 * Party A calls this to register the document on-chain.
 */
export function buildCreateDocumentTx(
  blobId:    string,
  hashBytes: Uint8Array,
  partyB:    string,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target:    `${PACKAGE_ID}::document::create_document`,
    arguments: [
      tx.pure.string(blobId),
      tx.pure.vector('u8', Array.from(hashBytes)),
      tx.pure.address(partyB),
    ],
  })
  return tx
}

/**
 * Build a Transaction to call walrussign::document::sign.
 * Signer (party A or B) calls this to record their signature on-chain.
 */
export function buildSignDocumentTx(objectId: string): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target:    `${PACKAGE_ID}::document::sign`,
    arguments: [
      tx.object(objectId),
      tx.object(CLOCK_OBJECT_ID),
    ],
  })
  return tx
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Convert a bytes array (number[]) to a hex string like 0xabc123...
 */
export function bytesToHex(bytes: number[]): string {
  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Format a Sui timestamp (ms since epoch) to a human-readable UTC string.
 */
export function formatTimestamp(msStr: string): string {
  const ms = parseInt(msStr, 10)
  if (!ms) return 'Not yet signed'
  return new Date(ms).toUTCString()
}

/**
 * Shorten a Sui address for display: 0x1234...abcd
 */
export function shortAddr(addr: string, chars = 8): string {
  if (!addr || addr.length < chars * 2) return addr
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`
}

/**
 * Get the created object ID from a transaction effects response.
 * Looks for a shared object created by the tx.
 */
export function extractCreatedObjectId(
  effects: { created?: Array<{ reference: { objectId: string } }> }
): string | null {
  return effects?.created?.[0]?.reference?.objectId ?? null
}
