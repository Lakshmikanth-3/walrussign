export default function CertificatePreview() {
  const fields = [
    { label: 'Document Hash', value: '0x7a3f8c...9e2d4b' },
    { label: 'Walrus Blob ID', value: '0x2f1a9b...8c4e7d' },
    { label: 'Party A', value: '0x7421...a3f9 ✅ Signed' },
    { label: 'Party B', value: '0x9e84...c2b1 ✅ Signed' },
    { label: 'Signed At', value: 'Block 14,892,341' },
    { label: 'Status', value: 'LOCKED 🔒', isLocked: true },
  ]

  return (
    <section
      id="certificate"
      className="section-padding-lg"
      style={{ background: '#03040a' }}
    >
      <div className="max-w-[1000px] mx-auto text-center">
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
          CERTIFICATE
        </span>
        <h2
          className="font-heading uppercase mt-4 mb-6"
          style={{
            fontSize: 'clamp(36px, 4.5vw, 56px)',
            fontWeight: 400,
            color: '#f0f0f0',
          }}
        >
          Verify Any Document Instantly
        </h2>
        <p
          className="mx-auto mb-[60px]"
          style={{
            fontSize: '16px',
            color: '#6b7fa3',
            maxWidth: '640px',
            lineHeight: 1.6,
          }}
        >
          Every signed document generates a permanent verification certificate. Share the link — anyone can verify signatures, timestamps, and document integrity without creating an account.
        </p>

        {/* Certificate card */}
        <div
          className="mx-auto text-left"
          style={{
            maxWidth: '720px',
            background: 'linear-gradient(135deg, rgba(10, 13, 26, 0.9), rgba(3, 4, 10, 0.95))',
            border: '1px solid rgba(0, 212, 255, 0.08)',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 0 60px rgba(0, 212, 255, 0.05)',
          }}
        >
          <h4
            className="font-heading font-bold text-center mb-8"
            style={{
              fontSize: '12px',
              letterSpacing: '0.15em',
              color: '#00d4ff',
            }}
          >
            VERIFICATION CERTIFICATE
          </h4>

          <div className="flex flex-col gap-5">
            {fields.map((field, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1"
                style={{
                  borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
                  paddingBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#3a4d6e',
                  }}
                >
                  {field.label}
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '14px',
                    color: field.isLocked ? '#00e5c9' : '#f0f0f0',
                  }}
                >
                  {field.value}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="https://suiscan.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-block no-underline"
            >
              View on SuiScan
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
