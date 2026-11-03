import { HeroSection } from './herosection'
import { SearchHistory } from './searchhistory'
import { PipelineSteps } from './pipelinesteps'
import { Footer } from './landingfooter'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <HeroSection />
      <SearchHistory />
      <PipelineSteps />
      <Footer />
    </main>
  )
}