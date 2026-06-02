import { useNavigate } from "react-router"
import { ArrowRight } from "lucide-react"
import CodeBlock from "./CodeBlock"
import DiagramSVG from "./DiagramSVG"

export default function Hero() {
  const navigate = useNavigate()
  return (
    <section className="min-h-[calc(100vh-88px)] flex items-center px-6 pt-16 pb-24">
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 text-primary text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Code → Diagram
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-6">
            Turn structure into<br />
            diagrams with code.
          </h1>
          <p className="text-lg text-foreground/45 leading-relaxed mb-10 max-w-md">
            Write simple LayerScript and instantly visualize systems, flows, and ideas. No dragging. No friction.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary text-primary-foreground font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-px"
            >
              Start Building
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <CodeBlock />
          <div className="rounded-xl bg-foreground/4 border border-border p-6">
            <p className="text-xs text-foreground/25 font-mono mb-4">→ generated diagram</p>
            <DiagramSVG />
          </div>
        </div>
      </div>
    </section>
  )
}
