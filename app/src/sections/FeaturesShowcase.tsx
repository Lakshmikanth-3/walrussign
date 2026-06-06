import { useRef, useEffect, useState } from 'react'

const panels = [
  {
    num: '01',
    title: 'Walrus Storage',
    desc: 'Your documents are encrypted and stored as blobs across the Walrus decentralized storage network. No single company controls your data — it lives on a distributed network of storage nodes, permanently available and censorship-resistant.',
    visual: 'hexgrid',
  },
  {
    num: '02',
    title: 'Sui Blockchain',
    desc: 'Every signature is recorded as a transaction on the Sui blockchain, providing an immutable, timestamped, and publicly verifiable record that cannot be altered, forged, or deleted by anyone.',
    visual: 'blockchain',
  },
  {
    num: '03',
    title: 'Zero Trust',
    desc: 'No central server ever touches your document or signature. The entire protocol runs on-chain and on decentralized storage. You never have to trust a company to keep your contracts safe.',
    visual: 'shield',
  },
]

function HexGridVisual() {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden pulse-opacity">
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              transparent 0deg 30deg,
              rgba(0, 212, 255, 0.03) 30deg 60deg
            )
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="grid grid-cols-6 gap-2 relative z-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8"
            style={{
              background: 'rgba(0, 212, 255, 0.08)',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              animation: `hex-pulse ${2 + (i % 3)}s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function BlockchainVisual() {
  const blocks = [
    { hash: '0x7a3f...9e2d', active: false },
    { hash: '0x2f1a...8c4e', active: false },
    { hash: '0x9b4c...1d3f', active: false },
    { hash: '0xe8d2...5a7b', active: false },
    { hash: '0x4c71...b2e9', active: true },
  ]

  return (
    <div className="flex-1 flex items-center justify-center gap-3">
      {blocks.map((block, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="relative"
            style={{
              width: '120px',
              height: '60px',
              borderRadius: '8px',
              background: '#0a0d1a',
              border: '1px solid rgba(0, 212, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: block.active ? '0 0 20px rgba(0, 212, 255, 0.2)' : 'none',
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: '11px', color: '#3a4d6e' }}
            >
              {block.hash}
            </span>
            {block.active && (
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                }}
              />
            )}
          </div>
          {i < blocks.length - 1 && (
            <div style={{ width: '16px', height: '2px', background: '#3a4d6e' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function ShieldVisual() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div
        className="pulse-shield"
        style={{
          width: '120px',
          height: '120px',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: 'linear-gradient(180deg, #00d4ff, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="text-4xl">🔒</span>
      </div>
    </div>
  )
}

function Visual({ type }: { type: string }) {
  if (type === 'hexgrid') return <HexGridVisual />
  if (type === 'blockchain') return <BlockchainVisual />
  if (type === 'shield') return <ShieldVisual />
  return null
}

export default function FeaturesShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)
  const isDownRef = useRef(false)
  const mouseXRef = useRef(0)
  const speedDRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return

    const trackEl = track
    let progress = 0
    let oldProgress = 0
    let speed = 0
    let diff = 0
    let isDown = false
    let mouseX = 0
    const autoSpeed = 0.5

    const maxScroll = trackEl.scrollWidth - container.clientWidth

    function clamp(val: number, min: number, max: number) {
      return Math.min(Math.max(val, min), max)
    }

    function lerp(a: number, b: number, n: number) {
      return (1 - n) * a + n * b
    }

    function norm(val: number, min: number, max: number) {
      return (val - min) / (max - min)
    }

    function updateProgress() {
      const clampedProgress = clamp(progress, 0, maxScroll)
      const percentage = norm(clampedProgress, 0, maxScroll) * 100
      const idx = Math.min(Math.floor(norm(clampedProgress, 0, maxScroll) * 3), 2)
      setActiveIndex(idx)
      return percentage
    }

    function run() {
      diff = lerp(diff, speed, 0.03)
      oldProgress = progress
      if (!isDown) progress += autoSpeed
      progress += diff
      progress = clamp(progress, 0, maxScroll)

      if (Math.abs(progress - oldProgress) > 0.01) {
        trackEl.scrollLeft = progress
      }

      speed -= speed * 0.01
      updateProgress()
      rafRef.current = requestAnimationFrame(run)
    }

    function onPointerDown(e: PointerEvent) {
      isDown = true
      mouseX = e.clientX
      speed = 0
    }

    function onPointerUp() {
      isDown = false
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDown) return
      const x = e.clientX
      const walk = (x - mouseX) * 2.5
      mouseX = x
      void mouseXRef
      void speedDRef
      void isDownRef
      speed += walk * 0.3
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      progress += e.deltaY * 0.5
      progress = clamp(progress, 0, maxScroll)
    }

    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    container.addEventListener('wheel', onWheel, { passive: false })

    run()

    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('wheel', onWheel)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section
      id="features"
      className="section-padding-lg overflow-hidden relative"
      style={{ background: '#000000' }}
    >
      <h2
        className="font-heading uppercase text-center mb-4"
        style={{
          fontSize: 'clamp(36px, 4.5vw, 56px)',
          fontWeight: 400,
          color: '#f0f0f0',
        }}
      >
        Built for Trustless Signing
      </h2>
      <p
        className="text-center mb-20"
        style={{ fontSize: '16px', color: '#6b7fa3' }}
      >
        Every feature engineered for cryptographic certainty
      </p>

      <div
        ref={containerRef}
        className="horizontal-gallery-container overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div
          ref={trackRef}
          className="horizontal-gallery-track flex gap-7"
          style={{ width: 'max-content', padding: '0 clamp(20px, 5vw, 80px)' }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              className="gallery-panel flex-shrink-0 flex flex-col relative overflow-hidden"
              style={{
                width: '85vw',
                maxWidth: '1100px',
                minHeight: '520px',
                background: '#0a0d1a',
                borderRadius: '40px',
                border: '1px solid rgba(0, 212, 255, 0.08)',
                padding: '48px',
                transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
                e.currentTarget.style.boxShadow = '0 0 60px rgba(0, 212, 255, 0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.08)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="panel-content">
                <span
                  className="font-heading font-bold block mb-4"
                  style={{
                    fontSize: '12px',
                    color: '#3a4d6e',
                    letterSpacing: '0.1em',
                    opacity: 0.5,
                  }}
                >
                  {panel.num}
                </span>
                <h3
                  className="font-heading mb-6"
                  style={{
                    fontSize: 'clamp(28px, 3.5vw, 44px)',
                    fontWeight: 400,
                    color: '#f0f0f0',
                    lineHeight: 1.1,
                  }}
                >
                  {panel.title}
                </h3>
                <p
                  className="mb-8"
                  style={{
                    fontSize: '16px',
                    color: '#6b7fa3',
                    lineHeight: 1.6,
                    maxWidth: '480px',
                  }}
                >
                  {panel.desc}
                </p>
                <Visual type={panel.visual} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-3 justify-center mt-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden"
            style={{
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{
                width: activeIndex === i ? '100%' : '0%',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
