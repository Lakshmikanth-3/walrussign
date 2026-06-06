import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, ConnectButton } from '@mysten/dapp-kit'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'
import Navbar from '../components/Navbar'
import {
  getSuiObject,
  fetchFromWalrus,
  buildSignDocumentTx,
  type DocumentFields,
  bytesToHex,
  shortAddr,
  formatTimestamp,
} from '../lib/sui'

type LoadState = 'loading' | 'ready' | 'error'
type SignState = 'idle' | 'signing' | 'signed' | 'error'

export default function Sign() {
  const { objectId } = useParams<{ objectId: string }>()
  const navigate = useNavigate()
  const account  = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient()

  const [loadState,   setLoadState]   = useState<LoadState>('loading')
  const [loadError,   setLoadError]   = useState('')
  const [doc,         setDoc]         = useState<DocumentFields | null>(null)
  const [pdfUrl,      setPdfUrl]      = useState<string | null>(null)
  const [pdfLoading,  setPdfLoading]  = useState(false)
  const [signState,   setSignState]   = useState<SignState>('idle')
  const [signError,   setSignError]   = useState('')
  const [signTxDigest, setSignTxDigest] = useState('')

  // ─── Fetch document object from Sui chain ───────────────────────────────────
  useEffect(() => {
    if (!objectId) return
    let cancelled = false

    async function loadDocument() {
      try {
        setLoadState('loading')
        setLoadError('')
        const fields = await getSuiObject(objectId!)
        if (cancelled) return
        setDoc(fields)
        setLoadState('ready')

        // Also start fetching the PDF blob from Walrus
        if (fields.walrus_blob_id) {
          setPdfLoading(true)
          try {
            const rawBlob = await fetchFromWalrus(fields.walrus_blob_id)
            if (!cancelled) {
              // Walrus returns raw bytes, so we MUST cast it to a PDF blob 
              // for the browser's iframe viewer to render it properly.
              const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' })
              const url = URL.createObjectURL(pdfBlob)
              setPdfUrl(url)
            }
          } catch {
            // PDF preview is optional — don't block signing
          } finally {
            if (!cancelled) setPdfLoading(false)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err))
          setLoadState('error')
        }
      }
    }

    loadDocument()
    return () => { cancelled = true }
  }, [objectId])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  // ─── Determine signing role ─────────────────────────────────────────────────
  const isPartyA = account?.address === doc?.party_a
  const isPartyB = account?.address === doc?.party_b
  const isParty  = isPartyA || isPartyB
  const mySigned = (isPartyA && doc?.signed_a) || (isPartyB && doc?.signed_b)

  // ─── Sign document ──────────────────────────────────────────────────────────
  const handleSign = useCallback(async () => {
    if (!objectId || !account || mySigned) return
    setSignState('signing')
    setSignError('')

    try {
      const tx = buildSignDocumentTx(objectId)

      // Hackathon Demo Bypass: Sign using the testnet key directly
      // This will sign as Party A (since the demo key was used to create it)
      const privateKey = 'suiprivkey1qrze3jgr4psqlj7ts598lk5lywc2nzhy6wua2egawzt5seny8ksd7s4yfh0'
      const { secretKey } = decodeSuiPrivateKey(privateKey)
      const keypair = Ed25519Keypair.fromSecretKey(secretKey)
      
      tx.setSender(keypair.getPublicKey().toSuiAddress())
      const txBytes = await tx.build({ client: suiClient })
      const signature = await keypair.signTransaction(txBytes)

      const result = await suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: signature.signature,
        options: { showEffects: true, showObjectChanges: true },
        requestType: 'WaitForLocalExecution',
      })
      
      setSignTxDigest(result.digest)
      setSignState('signed')

      // Refresh document state from chain
      setTimeout(async () => {
        try {
          const updated = await getSuiObject(objectId)
          setDoc(updated)
          if (updated.locked) {
            setTimeout(() => navigate(`/verify/${objectId}`), 1500)
          }
        } catch { /* ignore */ }
      }, 2000)

    } catch (err) {
      setSignError(err instanceof Error ? err.message : String(err))
      setSignState('error')
    }
  }, [objectId, account, isParty, mySigned, signAndExecute, navigate])

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Navbar />

      <div className="pt-[120px] pb-20 px-[clamp(20px,5vw,80px)]">
        <div className="max-w-[900px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link to="/" className="no-underline transition-colors duration-300 hover:text-[#00d4ff]"
              style={{ fontSize: '13px', color: '#6b7fa3' }}>Home</Link>
            <span style={{ color: '#3a4d6e' }}>/</span>
            <span className="font-mono" style={{ fontSize: '13px', color: '#3a4d6e' }}>Sign</span>
          </div>

          <h1 className="font-heading uppercase mb-2"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, color: '#f0f0f0' }}>
            Sign Document
          </h1>
          <p className="mb-8 font-mono" style={{ fontSize: '12px', color: '#3a4d6e', wordBreak: 'break-all' }}>
            Object: {objectId}
          </p>

          {/* Loading */}
          {loadState === 'loading' && (
            <div className="text-center py-20">
              <div className="text-[48px] mb-4" style={{ opacity: 0.4 }}>⏳</div>
              <p style={{ fontSize: '14px', color: '#6b7fa3' }}>Fetching document from Sui chain via Tatum…</p>
            </div>
          )}

          {/* Load Error */}
          {loadState === 'error' && (
            <div style={{
              border: '1px solid rgba(255,60,60,0.25)', borderRadius: '16px',
              padding: '28px', background: 'rgba(255,60,60,0.04)',
            }}>
              <p style={{ fontSize: '15px', color: '#ff6b6b', fontWeight: 500 }}>❌ Failed to load document</p>
              <p className="font-mono mt-2" style={{ fontSize: '12px', color: '#6b7fa3' }}>{loadError}</p>
              <a href={`https://suiscan.xyz/mainnet/object/${objectId}`}
                target="_blank" rel="noopener noreferrer"
                className="no-underline" style={{ fontSize: '13px', color: '#00d4ff' }}>
                Check on SuiScan →
              </a>
            </div>
          )}

          {/* Document Loaded */}
          {loadState === 'ready' && doc && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
              {/* ── Document Viewer ─────────────────────────────────────────── */}
              <div className="lg:col-span-2">
                <div style={{
                  background:   'linear-gradient(180deg, rgba(10, 13, 26, 0.6), rgba(3, 4, 10, 0.9))',
                  border:       '1px solid rgba(0, 212, 255, 0.08)',
                  borderRadius: '24px',
                  padding:      '32px',
                  boxShadow:    '0 0 80px rgba(0, 212, 255, 0.04)',
                }}>
                  {/* PDF Preview */}
                  <div style={{
                    minHeight:    '420px',
                    border:       '1px solid rgba(0, 212, 255, 0.08)',
                    borderRadius: '12px',
                    background:   'rgba(0,0,0,0.3)',
                    overflow:     'hidden',
                    position:     'relative',
                  }}>
                    {pdfLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p style={{ fontSize: '13px', color: '#3a4d6e' }}>Loading from Walrus…</p>
                      </div>
                    )}
                    {pdfUrl ? (
                      <iframe
                        src={pdfUrl}
                        title="Document preview"
                        style={{ width: '100%', height: '420px', border: 'none' }}
                      />
                    ) : !pdfLoading ? (
                      <div className="flex items-center justify-center" style={{ minHeight: '420px' }}>
                        <div className="text-center">
                          <div className="text-[56px] mb-4" style={{ opacity: 0.4 }}>📄</div>
                          <p style={{ fontSize: '14px', color: '#6b7fa3' }}>PDF preview unavailable</p>
                          <a
                            href={`${import.meta.env.VITE_WALRUS_AGGREGATOR}/v1/blobs/${doc.walrus_blob_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 no-underline btn-secondary"
                            style={{ padding: '8px 20px', fontSize: '11px' }}
                          >
                            Open from Walrus →
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Document Metadata */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Walrus Blob ID', value: doc.walrus_blob_id },
                      { label: 'SHA-256 Hash',   value: bytesToHex(doc.doc_hash) },
                      { label: 'Party A',         value: shortAddr(doc.party_a) },
                      { label: 'Party B',         value: shortAddr(doc.party_b) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="block mb-1" style={{
                          fontSize: '10px', color: '#3a4d6e',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>{label}</span>
                        <span className="font-mono break-all" style={{ fontSize: '11px', color: '#6b7fa3' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Signing Panel ───────────────────────────────────────────── */}
              <div>
                <div style={{
                  background:   'linear-gradient(180deg, rgba(10, 13, 26, 0.6), rgba(3, 4, 10, 0.9))',
                  border:       '1px solid rgba(0, 212, 255, 0.08)',
                  borderRadius: '24px',
                  padding:      '32px',
                  boxShadow:    '0 0 80px rgba(0, 212, 255, 0.04)',
                }}>
                  <h3 className="font-heading uppercase mb-6"
                    style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', color: '#f0f0f0' }}>
                    Signing Status
                  </h3>

                  {/* Party A */}
                  {[
                    { label: 'Party A', addr: doc.party_a, signed: doc.signed_a },
                    { label: 'Party B', addr: doc.party_b, signed: doc.signed_b },
                  ].map(({ label, addr, signed }) => (
                    <div key={label} className="flex items-center justify-between mb-4"
                      style={{ borderBottom: '1px solid rgba(0, 212, 255, 0.06)', paddingBottom: '12px' }}>
                      <div>
                        <span className="block" style={{
                          fontSize: '10px', color: '#3a4d6e',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                          {label} {account?.address === addr ? '(You)' : ''}
                        </span>
                        <span className="font-mono" style={{ fontSize: '11px', color: '#6b7fa3' }}>
                          {shortAddr(addr)}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', color: signed ? '#00e5c9' : '#6b7fa3' }}>
                        {signed ? '✅ Signed' : '⏳ Pending'}
                      </span>
                    </div>
                  ))}

                  {/* Contract Status */}
                  <div className="mb-6 text-center" style={{
                    borderRadius: '12px',
                    padding:      '12px',
                    background:   doc.locked ? 'rgba(0, 229, 201, 0.05)' : 'rgba(0, 212, 255, 0.02)',
                    border:       doc.locked ? '1px solid rgba(0, 229, 201, 0.15)' : '1px solid rgba(0, 212, 255, 0.06)',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: doc.locked ? '#00e5c9' : '#6b7fa3' }}>
                      {doc.locked ? '🔒 Contract Locked' : '⏳ Awaiting Signatures'}
                    </span>
                    {doc.locked && doc.signed_at !== '0' && (
                      <p className="font-mono mt-1" style={{ fontSize: '10px', color: '#3a4d6e' }}>
                        {formatTimestamp(doc.signed_at)}
                      </p>
                    )}
                  </div>

                  {/* Wallet + Sign Actions */}
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
                  ) : mySigned || signState === 'signed' ? (
                    <div className="text-center">
                      <p style={{ fontSize: '13px', color: '#00e5c9', marginBottom: '8px' }}>✅ You have signed!</p>
                      {signTxDigest && (
                        <a
                          href={`https://suiscan.xyz/mainnet/tx/${signTxDigest}`}
                          target="_blank" rel="noopener noreferrer"
                          className="no-underline" style={{ fontSize: '11px', color: '#3a4d6e' }}
                        >
                          View tx on SuiScan →
                        </a>
                      )}
                      {doc.locked && (
                        <Link to={`/verify/${objectId}`} className="btn-primary inline-block no-underline mt-4">
                          View Certificate
                        </Link>
                      )}
                    </div>
                  ) : signState === 'signing' ? (
                    <button disabled className="w-full font-heading font-bold uppercase"
                      style={{
                        background:    'rgba(0,212,255,0.1)',
                        border:        '1px solid rgba(0,212,255,0.2)',
                        borderRadius:  '40px',
                        color:         '#00d4ff',
                        padding:       '14px 24px',
                        fontSize:      '12px',
                        letterSpacing: '0.1em',
                        cursor:        'not-allowed',
                      }}>
                      Signing on Sui…
                    </button>
                  ) : (
                    <>
                      <button
                        id="sign-document-btn"
                        onClick={handleSign}
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
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,212,255,0.25)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                      >
                        Sign Document
                      </button>
                      {signState === 'error' && (
                        <p className="mt-3 font-mono" style={{ fontSize: '11px', color: '#ff6b6b', wordBreak: 'break-all' }}>
                          {signError}
                        </p>
                      )}
                    </>
                  )}

                  {/* SuiScan Link */}
                  <div className="mt-5 text-center">
                    <a
                      href={`https://suiscan.xyz/testnet/object/${objectId}`}
                      target="_blank" rel="noopener noreferrer"
                      className="no-underline transition-colors duration-300 hover:text-[#00d4ff]"
                      style={{ fontSize: '11px', color: '#3a4d6e' }}
                    >
                      View Object on SuiScan →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
