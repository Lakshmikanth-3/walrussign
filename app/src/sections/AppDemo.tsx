import { useState, useCallback } from 'react'
import { Link } from 'react-router'

export default function AppDemo() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setUploaded(true)
  }, [])

  const handleFileSelect = useCallback(() => {
    setUploaded(true)
  }, [])

  return (
    <section
      id="demo"
      className="section-padding-lg"
      style={{ background: '#03040a' }}
    >
      <div className="max-w-[1200px] mx-auto flex gap-[60px] items-start flex-col lg:flex-row">
        {/* Left column */}
        <div className="lg:flex-[0_0_45%]">
          <span
            className="block mb-4"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#00d4ff',
            }}
          >
            TRY IT NOW
          </span>
          <h2
            className="font-heading"
            style={{
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              fontWeight: 400,
              color: '#f0f0f0',
            }}
          >
            Upload & Sign a Document
          </h2>
          <p
            className="mt-5"
            style={{ fontSize: '16px', color: '#6b7fa3', lineHeight: 1.6 }}
          >
            Experience decentralized signing in seconds. Upload a PDF, share the signing link, and both parties sign on-chain. No servers, no trust required.
          </p>

          <div className="flex flex-col gap-5 mt-10">
            {[
              'Documents stored permanently on Walrus — no server can delete them',
              'Signatures recorded immutably on Sui blockchain',
              'Verify any document with its unique on-chain certificate',
            ].map((text, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className="flex-shrink-0 mt-1.5"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00d4ff',
                  }}
                />
                <p style={{ fontSize: '14px', color: '#6b7fa3', lineHeight: 1.5 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>

          <Link to="/upload" className="btn-primary mt-10 inline-block">
            Go to Upload Page →
          </Link>
        </div>

        {/* Right column — interactive upload card */}
        <div className="flex-1 w-full">
          <div
            className="w-full"
            style={{
              background: 'linear-gradient(180deg, rgba(10, 13, 26, 0.6), rgba(3, 4, 10, 0.9))',
              border: '1px solid rgba(0, 212, 255, 0.08)',
              borderRadius: '24px',
              padding: '48px',
              boxShadow: '0 0 80px rgba(0, 212, 255, 0.04)',
            }}
          >
            {/* Upload area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
              className="text-center cursor-pointer transition-all duration-300"
              style={{
                border: isDragging
                  ? '2px dashed rgba(0, 212, 255, 0.4)'
                  : uploaded
                  ? '2px solid rgba(0, 229, 201, 0.4)'
                  : '2px dashed rgba(0, 212, 255, 0.2)',
                borderRadius: '16px',
                padding: '48px 32px',
                background: isDragging
                  ? 'rgba(0, 212, 255, 0.04)'
                  : uploaded
                  ? 'rgba(0, 229, 201, 0.02)'
                  : 'transparent',
              }}
            >
              <div className="text-[48px] mb-3" style={{ opacity: 0.6 }}>
                {uploaded ? '✅' : '☁️'}
              </div>
              <p style={{ fontSize: '14px', color: '#6b7fa3' }}>
                {uploaded ? 'contract.pdf uploaded!' : 'Drop your PDF here or click to browse'}
              </p>
              {!uploaded && (
                <p style={{ fontSize: '12px', color: '#3a4d6e', marginTop: '8px' }}>
                  Max file size: 10MB
                </p>
              )}
            </div>

            {/* Wallet connect button */}
            <button
              onClick={() => setWalletConnected(!walletConnected)}
              className="w-full mt-6 font-heading font-bold uppercase cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: walletConnected
                  ? 'transparent'
                  : 'linear-gradient(90deg, #00d4ff, #7c3aed)',
                color: walletConnected ? '#00e5c9' : '#000',
                borderRadius: '40px',
                padding: '14px 24px',
                fontSize: '12px',
                letterSpacing: '0.1em',
                border: walletConnected ? '1px solid rgba(0, 229, 201, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!walletConnected) {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 212, 255, 0.25)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {walletConnected ? '✅ Wallet Connected (0x7421...a3f9)' : 'Connect Sui Wallet'}
            </button>

            {/* Signing link preview */}
            {uploaded && walletConnected && (
              <div className="mt-6">
                <label
                  className="block mb-2"
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#3a4d6e',
                  }}
                >
                  Signing Link
                </label>
                <div className="flex gap-2">
                  <div
                    className="flex-1 font-mono"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(0, 212, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#00d4ff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    walrussign.app/sign/0x7a3f...9e2d
                  </div>
                  <button
                    className="flex-shrink-0 cursor-pointer transition-all duration-300 hover:border-[#00d4ff]"
                    style={{
                      width: '44px',
                      height: '44px',
                      border: '1px solid rgba(0, 212, 255, 0.08)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: '#6b7fa3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Copy link"
                  >
                    📋
                  </button>
                </div>

                {/* Counterparty input */}
                <div className="mt-4">
                  <label
                    className="block mb-2"
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#3a4d6e',
                    }}
                  >
                    Counterparty Sui Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="w-full font-mono transition-all duration-300 focus:outline-none focus:border-[rgba(0,212,255,0.3)]"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(0, 212, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#f0f0f0',
                    }}
                  />
                </div>

                {/* Create document button */}
                <button
                  className="w-full mt-4 font-heading font-bold uppercase cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
                    color: '#000',
                    borderRadius: '40px',
                    padding: '14px 24px',
                    fontSize: '12px',
                    letterSpacing: '0.1em',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 212, 255, 0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Create Document on Sui
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
