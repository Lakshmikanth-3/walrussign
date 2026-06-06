import { Link } from 'react-router'
import CryptographicNetwork from '../components/CryptographicNetwork'

export default function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{
        minHeight: '100vh',
        background: '#000000',
      }}
    >
      <CryptographicNetwork />

      <div
        className="relative z-10 text-center px-6 flex flex-col items-center justify-center"
        style={{ maxWidth: '900px' }}
      >
        <h1
          className="font-heading uppercase shimmer-text"
          style={{
            fontSize: 'clamp(48px, 6.5vw, 88px)',
            fontWeight: 400,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            textShadow: '0 0 60px rgba(0,212,255,0.08)',
          }}
        >
          Sign Contracts on the Blockchain
        </h1>

        <p
          className="mt-6 mx-auto"
          style={{
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: '#6b7fa3',
            maxWidth: '560px',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          Store documents on Walrus decentralized storage. Sign immutably on Sui. No servers. No trust required.
        </p>

        <div className="flex items-center gap-4 mt-10 flex-wrap justify-center">
          <Link to="/upload" className="btn-primary">
            Launch App
          </Link>
          <a
            href="#demo"
            className="btn-secondary"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Watch Demo
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 bounce-arrow"
        style={{ color: '#3a4d6e', fontSize: '20px' }}
      >
        ↓
      </div>
    </section>
  )
}
