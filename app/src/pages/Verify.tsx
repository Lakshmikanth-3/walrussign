import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router'
import Navbar from '../components/Navbar'
import {
  getSuiObject,
  fetchFromWalrus,
  type DocumentFields,
  bytesToHex,
  shortAddr,
  formatTimestamp,
  WALRUS_AGG,
} from '../lib/sui'

type LoadState = 'loading' | 'ready' | 'error'

export default function Verify() {
  const { objectId } = useParams<{ objectId: string }>()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState('')
  const [doc,       setDoc]       = useState<DocumentFields | null>(null)
  const [pdfUrl,    setPdfUrl]    = useState<string | null>(null)

  // ─── Fetch on-chain document data via Tatum RPC ─────────────────────────────
  useEffect(() => {
    if (!objectId) return
    let cancelled = false

    async function load() {
      try {
        setLoadState('loading')
        const fields = await getSuiObject(objectId!)
        if (cancelled) return
        setDoc(fields)
        setLoadState('ready')

        // Prefetch PDF blob from Walrus for the download button
        if (fields.walrus_blob_id) {
          try {
            const blob = await fetchFromWalrus(fields.walrus_blob_id)
            if (!cancelled) setPdfUrl(URL.createObjectURL(blob))
          } catch { /* optional */ }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err))
          setLoadState('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [objectId])

  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  // ─── Derived data ────────────────────────────────────────────────────────────
  const hashHex      = doc ? bytesToHex(doc.doc_hash) : ''
  const signedAtStr  = doc ? formatTimestamp(doc.signed_at) : ''
  const walrusBlobUrl = doc ? `${WALRUS_AGG}/v1/blobs/${doc.walrus_blob_id}` : ''

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
            <span className="font-mono" style={{ fontSize: '13px', color: '#3a4d6e' }}>Verify</span>
          </div>

          <h1 className="font-heading uppercase mb-2"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, color: '#f0f0f0' }}>
            Verification Certificate
          </h1>
          <p className="mb-8 font-mono break-all" style={{ fontSize: '12px', color: '#3a4d6e' }}>
            Object: {objectId}
          </p>

          {/* Loading */}
          {loadState === 'loading' && (
            <div className="text-center py-20">
              <div className="text-[48px] mb-4" style={{ opacity: 0.4 }}>⏳</div>
              <p style={{ fontSize: '14px', color: '#6b7fa3' }}>Reading certificate from Sui blockchain via Tatum…</p>
            </div>
          )}

          {/* Error */}
          {loadState === 'error' && (
            <div style={{
              border:       '1px solid rgba(255,60,60,0.25)',
              borderRadius: '16px',
              padding:      '28px',
              background:   'rgba(255,60,60,0.04)',
            }}>
              <p style={{ fontSize: '15px', color: '#ff6b6b', fontWeight: 500 }}>❌ Failed to load certificate</p>
              <p className="font-mono mt-2" style={{ fontSize: '12px', color: '#6b7fa3' }}>{loadError}</p>
              <a href={`https://suiscan.xyz/mainnet/object/${objectId}`}
                target="_blank" rel="noopener noreferrer"
                className="no-underline mt-3 inline-block" style={{ fontSize: '13px', color: '#00d4ff' }}>
                Check on SuiScan →
              </a>
            </div>
          )}

          {/* Certificate */}
          {loadState === 'ready' && doc && (
            <>
              {/* ── Certificate Card ─────────────────────────────────────────── */}
              <div style={{
                background:   'linear-gradient(135deg, rgba(10, 13, 26, 0.9), rgba(3, 4, 10, 0.95))',
                border:       '1px solid rgba(0, 212, 255, 0.08)',
                borderRadius: '24px',
                padding:      '48px',
                boxShadow:    '0 0 60px rgba(0, 212, 255, 0.05)',
              }}>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="text-[48px] mb-3">🦭</div>
                  <h4 className="font-heading font-bold"
                    style={{ fontSize: '12px', letterSpacing: '0.15em', color: '#00d4ff' }}>
                    VERIFICATION CERTIFICATE
                  </h4>
                  <p style={{ fontSize: '13px', color: '#3a4d6e', marginTop: '8px' }}>
                    WalrusSign — Decentralized Document Signing on Sui
                  </p>
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-5">
                  {[
                    {
                      label:   'Walrus Blob ID',
                      value:   doc.walrus_blob_id,
                      isMono:  true,
                      link:    walrusBlobUrl,
                      linkLabel: 'Open blob →',
                    },
                    {
                      label:   'SHA-256 Hash',
                      value:   hashHex,
                      isMono:  true,
                    },
                    {
                      label:    'Party A',
                      value:    `${shortAddr(doc.party_a, 12)}`,
                      isMono:   true,
                      badge:    doc.signed_a ? '✅ Signed' : '⏳ Pending',
                      badgeColor: doc.signed_a ? '#00e5c9' : '#6b7fa3',
                      link:     `https://suiscan.xyz/mainnet/account/${doc.party_a}`,
                      linkLabel: 'View account →',
                    },
                    {
                      label:    'Party B',
                      value:    `${shortAddr(doc.party_b, 12)}`,
                      isMono:   true,
                      badge:    doc.signed_b ? '✅ Signed' : '⏳ Pending',
                      badgeColor: doc.signed_b ? '#00e5c9' : '#6b7fa3',
                      link:     `https://suiscan.xyz/mainnet/account/${doc.party_b}`,
                      linkLabel: 'View account →',
                    },
                    {
                      label:   'Contract Status',
                      value:   doc.locked ? '🔒 LOCKED' : '⏳ PENDING',
                      isLocked: doc.locked,
                    },
                    {
                      label:   'Signed At',
                      value:   doc.signed_at !== '0' ? signedAtStr : 'Not yet finalized',
                      isMono:  true,
                    },
                  ].map((field, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2"
                      style={{ borderBottom: '1px solid rgba(0, 212, 255, 0.06)', paddingBottom: '16px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: '#3a4d6e', flexShrink: 0,
                      }}>
                        {field.label}
                      </span>
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`${field.isMono ? 'font-mono' : ''} break-all text-right`}
                            style={{
                              fontSize:  '13px',
                              color:     field.isLocked ? '#00e5c9' : '#f0f0f0',
                              maxWidth:  '100%',
                            }}>
                            {field.value}
                          </span>
                          {'badge' in field && (
                            <span style={{ fontSize: '12px', color: field.badgeColor, flexShrink: 0 }}>
                              {field.badge}
                            </span>
                          )}
                        </div>
                        {'link' in field && field.link && (
                          <a href={field.link} target="_blank" rel="noopener noreferrer"
                            className="no-underline transition-colors duration-300 hover:text-[#00d4ff]"
                            style={{ fontSize: '11px', color: '#3a4d6e' }}>
                            {field.linkLabel}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verification Badge */}
                <div className="mt-8 text-center" style={{
                  borderRadius: '16px',
                  padding:      '20px',
                  background:   doc.locked ? 'rgba(0, 229, 201, 0.05)' : 'rgba(0, 212, 255, 0.03)',
                  border:       doc.locked ? '1px solid rgba(0, 229, 201, 0.15)' : '1px solid rgba(0, 212, 255, 0.08)',
                }}>
                  <div className="text-[32px] mb-2">{doc.locked ? '✅' : '⏳'}</div>
                  <p style={{ fontSize: '14px', color: doc.locked ? '#00e5c9' : '#6b7fa3', fontWeight: 500 }}>
                    {doc.locked
                      ? 'This document has been verified on-chain'
                      : 'This document is awaiting signatures'}
                  </p>
                  <p className="font-mono" style={{ fontSize: '12px', color: '#3a4d6e', marginTop: '4px' }}>
                    {doc.locked
                      ? 'Both parties have signed. The contract is permanently locked on the Sui blockchain.'
                      : `Signed A: ${doc.signed_a ? 'yes' : 'no'} · Signed B: ${doc.signed_b ? 'yes' : 'no'}`}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8 flex-wrap">
                  <a
                    href={`https://suiscan.xyz/mainnet/object/${objectId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-secondary text-center flex-1 no-underline"
                    id="suiscan-object-link"
                  >
                    View Object on SuiScan
                  </a>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download="document.pdf"
                      className="btn-secondary text-center flex-1 no-underline"
                      id="download-pdf-btn"
                    >
                      Download PDF from Walrus
                    </a>
                  )}
                  {!pdfUrl && doc.walrus_blob_id && (
                    <a
                      href={walrusBlobUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-center flex-1 no-underline"
                    >
                      Open PDF from Walrus
                    </a>
                  )}
                  {!doc.locked && (
                    <Link
                      to={`/sign/${objectId}`}
                      className="btn-primary text-center flex-1 no-underline"
                    >
                      Go to Sign Page
                    </Link>
                  )}
                </div>
              </div>

              {/* ── How Verification Works ────────────────────────────────────── */}
              <div className="mt-12">
                <h3 className="font-heading uppercase mb-6"
                  style={{ fontSize: '18px', fontWeight: 400, color: '#f0f0f0' }}>
                  How Verification Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      step:  '1',
                      title: 'Document Hash',
                      desc:  'The SHA-256 hash of the original PDF is stored on-chain. Anyone can verify the document has not been altered by rehashing.',
                    },
                    {
                      step:  '2',
                      title: 'Walrus Blob',
                      desc:  'The actual document is stored as a blob on Walrus decentralized storage. Fetched by blob ID — no central server needed.',
                    },
                    {
                      step:  '3',
                      title: 'On-Chain Signatures',
                      desc:  'Each signature is a Sui transaction. Anyone can verify the contract state by reading the Move object on-chain.',
                    },
                  ].map((item) => (
                    <div key={item.step} className="card-surface p-6">
                      <span className="inline-block font-heading font-bold text-[#00d4ff] mb-3"
                        style={{
                          fontSize: '12px', letterSpacing: '0.1em',
                          border: '1px solid rgba(0,212,255,0.2)', borderRadius: '20px', padding: '2px 12px',
                        }}>
                        {item.step}
                      </span>
                      <h4 className="font-heading mb-2" style={{ fontSize: '16px', fontWeight: 400, color: '#f0f0f0' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
