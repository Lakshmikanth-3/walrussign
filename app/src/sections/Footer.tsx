import { Link } from 'react-router'

export default function Footer() {
  return (
    <footer
      style={{
        background: '#000000',
        borderTop: '1px solid rgba(0, 212, 255, 0.08)',
        paddingTop: '60px',
        paddingBottom: '40px',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-[clamp(20px,5vw,80px)]">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row justify-between mb-12 gap-8">
          <div>
            <Link
              to="/"
              className="font-heading text-[18px] font-bold uppercase tracking-[0.08em] text-[#f0f0f0] flex items-center gap-2 no-underline"
            >
              <span className="text-[20px]">🦭</span>
              WalrusSign
            </Link>
            <p
              className="mt-2"
              style={{ fontSize: '13px', color: '#3a4d6e' }}
            >
              Decentralized document signing on Sui
            </p>
          </div>

          <div className="flex flex-col gap-1">
            {['Features', 'How It Works', 'Demo', 'Docs', 'GitHub'].map((link) => (
              <a
                key={link}
                href="#"
                className="no-underline transition-colors duration-300 hover:text-[#00d4ff]"
                style={{ fontSize: '13px', color: '#6b7fa3', lineHeight: 2.2 }}
                onClick={(e) => {
                  e.preventDefault()
                  if (link === 'GitHub') {
                    window.open('https://github.com', '_blank')
                  } else if (link === 'Docs') {
                    window.open('https://docs.wal.app', '_blank')
                  }
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(0, 212, 255, 0.08)' }}
        >
          <p style={{ fontSize: '12px', color: '#3a4d6e' }}>
            © 2025 WalrusSign. Built for Tatum x Walrus Hackathon.
          </p>
          <p style={{ fontSize: '12px', color: '#3a4d6e' }}>
            Powered by Tatum · Sui · Walrus
          </p>
        </div>
      </div>
    </footer>
  )
}
