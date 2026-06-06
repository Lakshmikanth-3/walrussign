const steps = [
  {
    num: '01',
    title: 'Connect',
    desc: 'Connect your Sui wallet. No email, no signup, no central server. Your wallet is your identity.',
  },
  {
    num: '02',
    title: 'Upload',
    desc: "Upload any PDF document. It's encrypted and stored permanently on Walrus decentralized storage — not on any company's servers.",
  },
  {
    num: '03',
    title: 'Share & Sign',
    desc: 'Share a signing link with the counterparty. They view the document from Walrus and sign with their wallet on-chain.',
  },
  {
    num: '04',
    title: 'Verify Forever',
    desc: 'Both signatures are recorded immutably on Sui. Anyone can verify the document, signatures, and timestamps forever.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section-padding-lg"
      style={{ background: '#03040a' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          className="font-heading uppercase text-center"
          style={{
            fontSize: 'clamp(36px, 4.5vw, 56px)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#f0f0f0',
          }}
        >
          How It Works
        </h2>
        <p
          className="text-center mt-4 mb-20"
          style={{ fontSize: '16px', fontWeight: 400, color: '#6b7fa3' }}
        >
          Four steps to permanently signed, tamper-proof documents
        </p>

        <div
          className="grid gap-7"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {steps.map((step) => (
            <div
              key={step.num}
              className="card-surface text-center p-10"
            >
              <span
                className="inline-block font-heading font-bold text-[#00d4ff] mb-5"
                style={{
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: '20px',
                  padding: '4px 16px',
                }}
              >
                {step.num}
              </span>
              <h3
                className="font-heading uppercase mb-3"
                style={{
                  fontSize: 'clamp(20px, 2.2vw, 28px)',
                  fontWeight: 400,
                  color: '#f0f0f0',
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#6b7fa3',
                  lineHeight: 1.6,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
