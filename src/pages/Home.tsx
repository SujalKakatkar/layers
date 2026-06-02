import Hero from "../components/home/Hero"
import Problem from "../components/home/Problem"
import Solution from "../components/home/Solution"
import HowItWorks from "../components/home/HowItWorks"
import Tools from "../components/home/Tools"
import WhyDifferent from "../components/home/WhyDifferent"
import FinalCTA from "../components/home/FinalCTA"

export default function Home () {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Tools />
      <WhyDifferent />
      <FinalCTA />
      <footer className="py-8 px-6 border-t border-border text-center">
        <p className="text-foreground/20 text-sm">© 2026 Layer. Canvas-based diagramming for structured thinkers.</p>
      </footer>
    </div>
  )
}