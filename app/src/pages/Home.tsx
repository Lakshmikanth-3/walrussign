import Navbar from '../components/Navbar'
import Hero from '../sections/Hero'
import Marquee from '../sections/Marquee'
import HowItWorks from '../sections/HowItWorks'
import FeaturesShowcase from '../sections/FeaturesShowcase'
import AppDemo from '../sections/AppDemo'
import SecurityFeatures from '../sections/SecurityFeatures'
import CertificatePreview from '../sections/CertificatePreview'
import CTASection from '../sections/CTASection'
import Footer from '../sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Navbar />
      <Hero />
      <Marquee />
      <HowItWorks />
      <FeaturesShowcase />
      <AppDemo />
      <SecurityFeatures />
      <CertificatePreview />
      <CTASection />
      <Footer />
    </div>
  )
}
