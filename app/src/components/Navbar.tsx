import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { shortAddr } from '../lib/sui'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location   = useLocation()
  const isHome     = location.pathname === '/'
  const account    = useCurrentAccount()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-300"
      style={{
        background:   scrolled ? 'rgba(10, 13, 26, 0.4)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0, 212, 255, 0.08)' : '1px solid transparent',
      }}
    >
      <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between px-[clamp(20px,5vw,80px)]">
        <Link
          to="/"
          className="font-heading text-[18px] font-bold uppercase tracking-[0.08em] text-[#f0f0f0] flex items-center gap-2 no-underline"
        >
          <span className="text-[20px]">🦭</span>
          WalrusSign
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {isHome ? (
            <>
              <button
                onClick={() => scrollToSection('features')}
                className="font-heading text-[11px] font-bold tracking-[0.12em] uppercase text-[#6b7fa3] hover:text-[#00d4ff] transition-all duration-300 hover:[text-shadow:0_0_20px_rgba(0,212,255,0.4)] bg-transparent border-none cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="font-heading text-[11px] font-bold tracking-[0.12em] uppercase text-[#6b7fa3] hover:text-[#00d4ff] transition-all duration-300 hover:[text-shadow:0_0_20px_rgba(0,212,255,0.4)] bg-transparent border-none cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('demo')}
                className="font-heading text-[11px] font-bold tracking-[0.12em] uppercase text-[#6b7fa3] hover:text-[#00d4ff] transition-all duration-300 hover:[text-shadow:0_0_20px_rgba(0,212,255,0.4)] bg-transparent border-none cursor-pointer"
              >
                Demo
              </button>
            </>
          ) : (
            <Link
              to="/"
              className="font-heading text-[11px] font-bold tracking-[0.12em] uppercase text-[#6b7fa3] hover:text-[#00d4ff] transition-all duration-300 hover:[text-shadow:0_0_20px_rgba(0,212,255,0.4)] no-underline"
            >
              Home
            </Link>
          )}

          {/* Real wallet connection — shows address if connected, connect button if not */}
          {account ? (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-[40px]"
                style={{
                  background:   'rgba(0, 229, 201, 0.08)',
                  border:       '1px solid rgba(0, 229, 201, 0.25)',
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: '#00e5c9', boxShadow: '0 0 6px #00e5c9' }}
                />
                <span
                  className="font-mono text-[#00e5c9]"
                  style={{ fontSize: '12px' }}
                >
                  {shortAddr(account.address, 6)}
                </span>
              </div>
              <ConnectButton
                style={{
                  background:    'transparent',
                  border:        '1px solid rgba(0,212,255,0.15)',
                  borderRadius:  '40px',
                  color:         '#6b7fa3',
                  fontSize:      '11px',
                  fontFamily:    'inherit',
                  padding:       '8px 16px',
                  cursor:        'pointer',
                  letterSpacing: '0.08em',
                }}
              />
            </div>
          ) : (
            <ConnectButton
              style={{
                background:    'linear-gradient(90deg, #00d4ff, #7c3aed)',
                border:        'none',
                borderRadius:  '40px',
                color:         '#000',
                fontSize:      '11px',
                fontFamily:    'inherit',
                fontWeight:    700,
                padding:       '10px 24px',
                cursor:        'pointer',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            />
          )}
        </div>
      </div>
    </nav>
  )
}
