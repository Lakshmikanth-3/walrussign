import { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router'
import { useCurrentAccount, useSignTransaction, ConnectButton, useSuiClient } from '@mysten/dapp-kit'
import Navbar from '../components/Navbar'
import {
  uploadToWalrus,
  hashFile,
  buildCreateDocumentTx,
  extractCreatedObjectId,
  shortAddr,
  bytesToHex,
} from '../lib/sui'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'

// ─── Step States ──────────────────────────────────────────────────────────────
type Step = 'idle' | 'hashing' | 'uploading' | 'creating' | 'done' | 'error'

interface ProgressState {
  step:     Step
  message:  string
  blobId:   string
  fileHash: string
  objectId: string
  txDigest: string
  error:    string
}

const INITIAL: ProgressState = {
  step:     'idle',
  message:  '',
  blobId:   '',
  fileHash: '',
  objectId: '',
  txDigest: '',
  error:    '',
}

export default function Upload() {
  const account   = useCurrentAccount()
  const suiClient  = useSuiClient()
  const { mutateAsync: signTransaction } = useSignTransaction()

  const [isDragging,    setIsDragging]    = useState(false)
  const [uploadedFile,  setUploadedFile]  = useState<File | null>(null)
  const [partyBAddress, setPartyBAddress] = useState('')
  const [privateKey,    setPrivateKey]    = useState('suiprivkey1qrze3jgr4psqlj7ts598lk5lywc2nzhy6wua2egawzt5seny8ksd7s4yfh0')
  const [progress,      setProgress]      = useState<ProgressState>(INITIAL)
  const [signingLink,   setSigningLink]   = useState('')
  const [copied,        setCopied]        = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── File Handlers ──────────────────────────────────────────────────────────
  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      setUploadedFile(file)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadedFile(file)
  }, [])

  // ─── Main Create Flow ────────────────────────────────────────────────────────
  const handleCreateDocument = useCallback(async () => {
    if (!uploadedFile || !partyBAddress.trim() || !account) return

    // Validate counterparty address
    const cleanPartyB = partyBAddress.trim().replace(/\s+/g, '')
    if (!cleanPartyB.startsWith('0x') || cleanPartyB.length < 60) {
      setProgress(p => ({ ...p, step: 'error', error: 'Invalid Party B address. Must be a valid 0x... Sui address.' }))
      return
    }

    setProgress(INITIAL)

    try {
      // Step 1: Hash the file
      setProgress(p => ({ ...p, step: 'hashing', message: 'Computing SHA-256 hash...' }))
      const hashBytes = await hashFile(uploadedFile)
      const fileHash  = bytesToHex(Array.from(hashBytes))

      // Step 2: Upload to Walrus
      setProgress(p => ({ ...p, step: 'uploading', message: 'Uploading to Walrus decentralized storage...', fileHash }))
      const blobId = await uploadToWalrus(uploadedFile)

      // Step 3: Create on-chain document object
      setProgress(p => ({ ...p, step: 'creating', message: 'Creating document on Sui via Tatum RPC...', blobId }))
      const tx = buildCreateDocumentTx(blobId, hashBytes, cleanPartyB)

      // We bypass the connected wallet completely and sign with the Demo Private Key
      // Set the sender to the demo key's address
      let keypair: Ed25519Keypair
      try {
        const { secretKey } = decodeSuiPrivateKey(privateKey.trim())
        keypair = Ed25519Keypair.fromSecretKey(secretKey)
      } catch (e) {
        throw new Error("Invalid private key format.")
      }
      
      tx.setSender(keypair.getPublicKey().toSuiAddress())
      
      const txBytes = await tx.build({ client: suiClient })
      const signature = await keypair.signTransaction(txBytes)

      // Step 5: Execute via our Tatum RPC directly (bypasses Slush execution)
      setProgress(p => ({ ...p, step: 'creating', message: 'Submitting transaction to Sui blockchain...' }))
      const execResult = await suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature:        signature.signature,
        options: {
          showEffects:       true,
          showObjectChanges: true,
        },
        requestType: 'WaitForLocalExecution',
      })

      const digest   = execResult.digest
      const objectId = extractCreatedObjectId(
        (execResult as unknown as { effects: { created?: Array<{ reference: { objectId: string } }> } }).effects
      ) ?? ''

      const link = `${window.location.origin}/sign/${objectId}`
      setSigningLink(link)
      setProgress(p => ({ ...p, step: 'done', message: 'Document created on-chain!', objectId, txDigest: digest }))

    } catch (err) {
      console.error(err)
      let msg = 'Unknown error';
      if (err instanceof Error) msg = err.message;
      else if (typeof err === 'object' && err !== null) {
        msg = JSON.stringify(err, Object.getOwnPropertyNames(err));
      } else {
        msg = String(err);
      }
      setProgress(p => ({ ...p, step: 'error', error: msg }))
    }
  }, [uploadedFile, partyBAddress, account, signTransaction, suiClient])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(signingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [signingLink])

  const isCreating  = ['hashing', 'uploading', 'creating'].includes(progress.step)
  const isDone      = progress.step === 'done'
  const hasError    = progress.step === 'error'
  const canCreate   = !!uploadedFile && !!partyBAddress.trim() && !!privateKey.trim() && !!account && !isCreating && !isDone
  const showProgress = isCreating || hasError || isDone

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Navbar />

      <div className="pt-[120px] pb-20 px-[clamp(20px,5vw,80px)]">
        <div className="max-w-[800px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link to="/" className="no-underline transition-colors duration-300 hover:text-[#00d4ff]"
              style={{ fontSize: '13px', color: '#6b7fa3' }}>Home</Link>
            <span style={{ color: '#3a4d6e' }}>/</span>
            <span style={{ fontSize: '13px', color: '#3a4d6e' }}>Upload</span>
          </div>

          <h1 className="font-heading uppercase mb-2"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, color: '#f0f0f0' }}>
            Upload Document
          </h1>
          <p className="mb-10" style={{ fontSize: '16px', color: '#6b7fa3', lineHeight: 1.6 }}>
            Upload a PDF to Walrus decentralized storage and deploy an on-chain signing contract via Tatum.
          </p>

          <div style={{
            background:   'linear-gradient(180deg, rgba(10, 13, 26, 0.6), rgba(3, 4, 10, 0.9))',
            border:       '1px solid rgba(0, 212, 255, 0.08)',
            borderRadius: '24px',
            padding:      '48px',
            boxShadow:    '0 0 80px rgba(0, 212, 255, 0.04)',
          }}>

            {/* ── Step 1: Upload PDF ─────────────────────────────────────────── */}
            <div className="mb-8">
              <span className="block mb-4" style={{
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#00d4ff',
              }}>STEP 1 — UPLOAD PDF</span>

              {!uploadedFile ? (
                <div
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center cursor-pointer transition-all duration-300"
                  style={{
                    border:       isDragging ? '2px dashed rgba(0, 212, 255, 0.4)' : '2px dashed rgba(0, 212, 255, 0.2)',
                    borderRadius: '16px',
                    padding:      '64px 32px',
                    background:   isDragging ? 'rgba(0, 212, 255, 0.04)' : 'transparent',
                  }}
                >
                  <div className="text-[56px] mb-3" style={{ opacity: 0.6 }}>☁️</div>
                  <p style={{ fontSize: '15px', color: '#f0f0f0', marginBottom: '8px' }}>
                    Drop your PDF here or click to browse
                  </p>
                  <p style={{ fontSize: '13px', color: '#3a4d6e' }}>Max file size: 10MB</p>
                  <input
                    ref={fileInputRef}
                    id="file-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4" style={{
                  border:       '1px solid rgba(0, 229, 201, 0.2)',
                  borderRadius: '16px',
                  padding:      '20px 24px',
                  background:   'rgba(0, 229, 201, 0.02)',
                }}>
                  <div className="text-[32px]">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontSize: '14px', color: '#f0f0f0' }}>{uploadedFile.name}</p>
                    <p style={{ fontSize: '12px', color: '#3a4d6e' }}>
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => { setUploadedFile(null); setProgress(INITIAL) }}
                    className="cursor-pointer transition-colors duration-300 hover:text-[#ff4444]"
                    style={{ background: 'none', border: 'none', color: '#6b7fa3', fontSize: '18px' }}
                  >✕</button>
                </div>
              )}
            </div>

            {/* ── Step 2: Connect Wallet ─────────────────────────────────────── */}
            <div className="mb-8">
              <span className="block mb-4" style={{
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#00d4ff',
              }}>STEP 2 — CONNECT WALLET</span>

              {!account ? (
                <ConnectButton
                  style={{
                    width:         '100%',
                    background:    'linear-gradient(90deg, #00d4ff, #7c3aed)',
                    border:        'none',
                    borderRadius:  '40px',
                    color:         '#000',
                    fontSize:      '12px',
                    fontFamily:    'inherit',
                    fontWeight:    700,
                    padding:       '14px 24px',
                    cursor:        'pointer',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                />
              ) : (
                <div className="flex items-center gap-3" style={{
                  border:       '1px solid rgba(0, 229, 201, 0.2)',
                  borderRadius: '16px',
                  padding:      '16px 20px',
                  background:   'rgba(0, 229, 201, 0.02)',
                }}>
                  <div className="text-[24px]">✅</div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#00e5c9' }}>Wallet Connected</p>
                    <p className="font-mono" style={{ fontSize: '12px', color: '#3a4d6e' }}>
                      {shortAddr(account.address, 10)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Step 3: Counterparty Address ───────────────────────────────── */}
              <div className="mb-8">
                <span className="block mb-4" style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#00d4ff',
                }}>STEP 3 — COUNTERPARTY ADDRESS (PARTY B)</span>
                <input
                  type="text"
                  value={partyBAddress}
                  onChange={(e) => setPartyBAddress(e.target.value)}
                  placeholder="Enter Party B Sui address (0x...)"
                  className="w-full font-mono transition-all duration-300 focus:outline-none mb-6"
                  style={{
                    background:   'rgba(0, 0, 0, 0.4)',
                    border:       '1px solid rgba(0, 212, 255, 0.12)',
                    borderRadius: '12px',
                    padding:      '14px 16px',
                    fontSize:     '14px',
                    color:        '#f0f0f0',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.12)' }}
                />
              </div>

            {/* ── Step 4: Create Document ────────────────────────────────────── */}
            {canCreate && (
              <div>
                <span className="block mb-4" style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#00d4ff',
                }}>STEP 4 — CREATE ON-CHAIN DOCUMENT</span>
                <button
                  id="create-document-btn"
                  onClick={handleCreateDocument}
                  className="w-full font-heading font-bold uppercase cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background:    'linear-gradient(90deg, #00d4ff, #7c3aed)',
                    border:        'none',
                    color:         '#000',
                    borderRadius:  '40px',
                    padding:       '14px 24px',
                    fontSize:      '12px',
                    letterSpacing: '0.1em',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 212, 255, 0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                >
                  Upload to Walrus + Create on Sui
                </button>
              </div>
            )}

            {/* ── Progress / Status ──────────────────────────────────────────── */}
            {showProgress && progress.step !== 'idle' && (
              <div className="mt-8" style={{
                border:       '1px solid rgba(0, 212, 255, 0.15)',
                borderRadius: '16px',
                padding:      '24px',
                background:   'rgba(0, 212, 255, 0.03)',
              }}>
                {/* Animated progress steps */}
                {[
                  { id: 'hashing',   label: 'Computing SHA-256 hash', detail: progress.fileHash ? `${progress.fileHash.slice(0, 20)}...` : '' },
                  { id: 'uploading', label: 'Uploading to Walrus',     detail: progress.blobId   ? `Blob: ${progress.blobId.slice(0, 20)}...` : '' },
                  { id: 'creating',  label: 'Deploying on Sui via Tatum', detail: '' },
                ].map(({ id, label, detail }) => {
                  const steps   = ['hashing', 'uploading', 'creating']
                  const idx     = steps.indexOf(id)
                  const current = steps.indexOf(progress.step)
                  const done    = idx < current
                  const active  = idx === current
                  return (
                    <div key={id} className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{
                          background: done ? '#00e5c9' : active ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                          border:     done ? 'none' : active ? '1px solid #00d4ff' : '1px solid rgba(255,255,255,0.1)',
                        }}>
                        {done   ? <span style={{ fontSize: '10px' }}>✓</span>
                        : active ? <span className="animate-spin" style={{ fontSize: '10px' }}>◌</span>
                        : null}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', color: active ? '#f0f0f0' : done ? '#00e5c9' : '#3a4d6e' }}>{label}</p>
                        {detail && <p className="font-mono" style={{ fontSize: '11px', color: '#3a4d6e', marginTop: '2px' }}>{detail}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Error ─────────────────────────────────────────────────────── */}
            {hasError && (
              <div className="mt-8" style={{
                border:       '1px solid rgba(255, 60, 60, 0.25)',
                borderRadius: '16px',
                padding:      '20px 24px',
                background:   'rgba(255, 60, 60, 0.04)',
              }}>
                <p style={{ fontSize: '13px', color: '#ff6b6b', fontWeight: 500 }}>❌ Error</p>
                <p className="font-mono mt-2" style={{ fontSize: '12px', color: '#6b7fa3', wordBreak: 'break-all' }}>
                  {progress.error}
                </p>
                <button
                  onClick={() => setProgress(INITIAL)}
                  className="mt-4 cursor-pointer transition-colors duration-300 hover:text-[#00d4ff]"
                  style={{ background: 'none', border: 'none', color: '#6b7fa3', fontSize: '12px' }}
                >
                  ↩ Try again
                </button>
              </div>
            )}

            {/* ── Success ───────────────────────────────────────────────────── */}
            {isDone && signingLink && (
              <div className="mt-8" style={{
                border:       '1px solid rgba(0, 229, 201, 0.2)',
                borderRadius: '16px',
                padding:      '28px',
                background:   'rgba(0, 229, 201, 0.02)',
              }}>
                <div className="text-center mb-6">
                  <div className="text-[40px] mb-2">🎉</div>
                  <h3 className="font-heading" style={{ fontSize: '20px', fontWeight: 400, color: '#00e5c9' }}>
                    Document Created On-Chain!
                  </h3>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    { label: 'Walrus Blob ID', value: progress.blobId },
                    { label: 'SHA-256 Hash',   value: progress.fileHash },
                    { label: 'Sui Object ID',  value: progress.objectId },
                    { label: 'Tx Digest',      value: progress.txDigest },
                  ].map(({ label, value }) => value ? (
                    <div key={label} style={{
                      background:   'rgba(0,0,0,0.3)',
                      border:       '1px solid rgba(0,212,255,0.06)',
                      borderRadius: '10px',
                      padding:      '12px 14px',
                    }}>
                      <span style={{ fontSize: '10px', color: '#3a4d6e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {label}
                      </span>
                      <p className="font-mono mt-1 break-all" style={{ fontSize: '11px', color: '#6b7fa3' }}>{value}</p>
                    </div>
                  ) : null)}
                </div>

                {/* Signing link */}
                <label className="block mb-2" style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#3a4d6e',
                }}>
                  Signing Link — Share with Party B
                </label>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 font-mono" style={{
                    background:    'rgba(0, 0, 0, 0.4)',
                    border:        '1px solid rgba(0, 212, 255, 0.08)',
                    borderRadius:  '12px',
                    padding:       '12px 16px',
                    fontSize:      '13px',
                    color:         '#00d4ff',
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                    whiteSpace:    'nowrap',
                  }}>
                    {signingLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    id="copy-link-btn"
                    className="flex-shrink-0 cursor-pointer transition-all duration-300"
                    style={{
                      width:        '44px',
                      height:       '44px',
                      border:       copied ? '1px solid #00e5c9' : '1px solid rgba(0, 212, 255, 0.08)',
                      borderRadius: '8px',
                      background:   'transparent',
                      color:        copied ? '#00e5c9' : '#6b7fa3',
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                      fontSize:     '16px',
                    }}
                    title="Copy link"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={signingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-center flex-1 no-underline"
                  >
                    Open Signing Page
                  </a>
                  {progress.objectId && (
                    <a
                      href={`https://suiscan.xyz/testnet/object/${progress.objectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-center flex-1 no-underline"
                    >
                      View on SuiScan →
                    </a>
                  )}
                  {progress.objectId && (
                    <Link
                      to={`/verify/${progress.objectId}`}
                      className="btn-secondary text-center flex-1 no-underline"
                    >
                      View Certificate
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
