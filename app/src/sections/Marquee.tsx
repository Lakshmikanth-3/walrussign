const logos = ['TATUM', 'SUI', 'WALRUS', 'MYSTEN LABS', 'SUITE']

export default function Marquee() {
  const allLogos = [...logos, ...logos, ...logos, ...logos]

  return (
    <section
      className="w-full overflow-hidden"
      style={{
        background: '#000000',
        borderTop: '1px solid rgba(0, 212, 255, 0.08)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
        padding: '24px 0',
      }}
    >
      <div className="scroll-logos whitespace-nowrap">
        {allLogos.map((logo, i) => (
          <span
            key={i}
            className="font-heading inline-block align-middle"
            style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#3a4d6e',
              opacity: 0.4,
              marginRight: '80px',
              textTransform: 'uppercase',
            }}
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  )
}
