const features = [
  {
    icon: '🔐',
    title: 'Immutable Signatures',
    desc: "Every signature is a permanent transaction on the Sui blockchain. No one can forge, alter, or delete it — not even us.",
  },
  {
    icon: '🧊',
    title: 'Walrus Storage',
    desc: "Documents are stored as encrypted blobs across a decentralized network. No single point of failure. No company can lose your data.",
  },
  {
    icon: '⚡',
    title: 'Instant Verification',
    desc: 'Anyone can verify a signed document in seconds by checking its on-chain certificate. No account needed.',
  },
]

export default function SecurityFeatures() {
  return (
    <section
      className="section-padding-lg relative overflow-hidden"
      style={{ background: '#000000' }}
    >
      <h2
        className="font-heading uppercase text-center mb-4"
        style={{
          fontSize: 'clamp(36px, 4.5vw, 56px)',
          fontWeight: 400,
          color: '#f0f0f0',
          textShadow: '0 0 40px rgba(0,212,255,0.08)',
        }}
      >
        Cryptographic Security
      </h2>
      <p
        className="text-center mb-20"
        style={{ fontSize: '16px', color: '#6b7fa3' }}
      >
        Every layer protected by decentralized infrastructure
      </p>

      {/* Glass panel visual */}
      <div
        className="relative mx-auto mb-20 flex items-center justify-center overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '900px',
          height: '300px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(124, 58, 237, 0.05))',
          border: '1px solid rgba(0, 212, 255, 0.12)',
          boxShadow: '0 0 60px rgba(0, 212, 255, 0.04), inset 0 0 60px rgba(124, 58, 237, 0.02)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Animated background glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0, 212, 255, 0.08) 0%, transparent 70%)',
            animation: 'pulse-opacity 4s ease-in-out infinite',
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <h3
          className="font-heading relative z-10 text-center px-4"
          style={{
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 400,
            color: '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Trust Nothing. Verify Everything.
        </h3>
      </div>

      {/* Feature cards */}
      <div
        className="max-w-[1200px] mx-auto grid gap-7"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {features.map((f, i) => (
          <div
            key={i}
            className="card-surface p-9"
          >
            <div className="text-[40px] mb-5">{f.icon}</div>
            <h4
              className="font-heading mb-3"
              style={{ fontSize: '18px', fontWeight: 400, color: '#f0f0f0' }}
            >
              {f.title}
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7fa3', lineHeight: 1.6 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
