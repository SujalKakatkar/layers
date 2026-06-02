import { useNavigate } from "react-router"
import { ArrowRight } from "lucide-react"

export default function FinalCTA() {
  const navigate = useNavigate()
  return (
    <section className="py-36 px-6 border-t border-border text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Start building diagrams<br />with structure.
        </h2>
        <p className="text-foreground/40 text-lg mb-10">
          No setup. Just open the canvas and start writing.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary hover:bg-primary text-primary-foreground font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-0.5"
        >
          Create Your First Canvas
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  )
}
