import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router'

gsap.registerPlugin(ScrollTrigger)

const frames = [
  {
    title: 'Sign Without Servers',
    subtitle: 'No company controls your contracts',
  },
  {
    title: 'Store on Walrus',
    subtitle: 'Decentralized storage, permanent availability',
  },
  {
    title: 'Verify on Sui',
    subtitle: 'Blockchain-immortalized signatures',
  },
  {
    title: 'Get Started',
    subtitle: 'Connect your wallet and sign your first document',
    cta: true,
  },
]

export default function CTASection() {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const container = wrapper.querySelector('.cta-perspective-container') as HTMLElement
    const frameEls = wrapper.querySelectorAll('.cta-frame')
    if (!container || !frameEls.length) return

    // Initial z-index for first frame
    gsap.fromTo(frameEls[0], { zIndex: 0 }, { zIndex: 1, duration: 0 })

    const tl = gsap.timeline()

    frameEls.forEach((frame, i) => {
      const isLast = i === frameEls.length - 1
      const inner = frame.querySelector('.cta-frame-inner')

      // Frame entrance
      tl.fromTo(
        container,
        { transform: `translateZ(-100vw) rotateY(${(i % 2 === 0) ? 10 : -10}deg)` },
        { transform: 'translateZ(0vw) rotateY(0deg)', ease: 'power1.inOut' },
        i * 1
      )

      // Brightness entrance
      if (inner) {
        tl.fromTo(
          inner,
          { filter: 'brightness(250%)' },
          { filter: 'brightness(100%)', ease: 'power1.inOut' },
          i * 1
        )
      }

      // Frame exit
      tl.to(
        container,
        { transform: `translateZ(100vw) rotateY(${(i % 2 === 0) ? -10 : 10}deg)`, ease: 'power1.inOut' },
        i * 1 + 0.8
      )

      // Brightness exit
      if (inner) {
        tl.to(
          inner,
          { filter: 'brightness(30%)', ease: 'power1.inOut' },
          i * 1 + 0.8
        )
      }

      // Next frame z-index
      if (!isLast) {
        tl.fromTo(
          frameEls[i + 1],
          { zIndex: i + 1 },
          { zIndex: i + 2 },
          i * 1 + 0.5
        )
      }
    })

    const st = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top top',
      end: `+=${frameEls.length * 100}%`,
      pin: true,
      scrub: true,
      animation: tl,
    })

    return () => {
      st.kill()
      tl.kill()
    }
  }, [])

  return (
    <section
      className="cta-perspective-wrapper relative"
      ref={wrapperRef}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#000000',
      }}
    >
      <div
        className="cta-perspective-container"
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          transformStyle: 'preserve-3d',
          perspective: '200vw',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {frames.map((frame, i) => (
          <div
            key={i}
            className="cta-frame absolute inset-0 flex items-center justify-center"
            style={{
              width: '100vw',
              height: '100vh',
              zIndex: 0,
            }}
          >
            <div
              className="cta-frame-inner text-center"
              style={{
                width: '50vw',
                maxWidth: '600px',
              }}
            >
              <h2
                className="font-heading uppercase gradient-text-certificate"
                style={{
                  fontSize: 'clamp(32px, 4vw, 52px)',
                  fontWeight: 400,
                  lineHeight: 1.1,
                }}
              >
                {frame.title}
              </h2>
              <p
                className="mt-4"
                style={{ fontSize: '16px', color: '#6b7fa3' }}
              >
                {frame.subtitle}
              </p>
              {frame.cta && (
                <div className="mt-8">
                  <Link to="/upload" className="btn-primary">
                    Launch App
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
