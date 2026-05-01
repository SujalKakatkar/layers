import {ArrowRight, Code2, Layers, Move, MousePointer, Copy, Square, GitBranch, Zap} from "lucide-react"
import {useNavigate} from "react-router"

// ─── Diagram SVG ─────────────────────────────────────────────────────────────
function DiagramSVG () {
  return (
    <svg viewBox="0 0 420 130" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="100" height="48" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <text x="60" y="69" textAnchor="middle" fill="white" fontSize="13" fontWeight="500" fontFamily="Figtree Variable, sans-serif">User</text>
      <line x1="110" y1="64" x2="153" y2="64" stroke="#10B981" strokeWidth="1.5" />
      <polygon points="147,59 158,64 147,69" fill="#10B981" />
      <rect x="160" y="40" width="100" height="48" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <text x="210" y="69" textAnchor="middle" fill="white" fontSize="13" fontWeight="500" fontFamily="Figtree Variable, sans-serif">Login</text>
      <line x1="260" y1="64" x2="303" y2="64" stroke="#10B981" strokeWidth="1.5" />
      <polygon points="297,59 308,64 297,69" fill="#10B981" />
      <rect x="310" y="40" width="100" height="48" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <text x="360" y="69" textAnchor="middle" fill="white" fontSize="11" fontWeight="500" fontFamily="Figtree Variable, sans-serif">Dashboard</text>
    </svg>
  )
}

// ─── Code Block ──────────────────────────────────────────────────────────────
function CodeBlock ({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-white/5 border border-white/10 p-6 font-mono text-sm ${className}`}>
      <div className="flex items-center gap-1.5 mb-5">
        <div className="w-3 h-3 rounded-full bg-white/15" />
        <div className="w-3 h-3 rounded-full bg-white/15" />
        <div className="w-3 h-3 rounded-full bg-white/15" />
        <span className="ml-3 text-white/25 text-xs">layerscript</span>
      </div>
      <div className="space-y-2 leading-relaxed">
        <div className="flex gap-4">
          <span className="text-white/20 select-none w-4">1</span>
          <span><span className="text-emerald-400">User</span><span className="text-white/40"> =&gt; </span><span className="text-white">Login</span></span>
        </div>
        <div className="flex gap-4">
          <span className="text-white/20 select-none w-4">2</span>
          <span><span className="text-white">Login</span><span className="text-white/40"> =&gt; </span><span className="text-white">Dashboard</span></span>
        </div>
        <div className="flex gap-4 mt-4">
          <span className="text-white/20 select-none w-4">3</span>
          <span className="text-white/20">{"// diagram auto-generates ↓"}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Section 1: Hero ─────────────────────────────────────────────────────────
function Hero () {
  const navigate = useNavigate()
  return (
    <section className="min-h-[calc(100vh-88px)] flex items-center px-6 pt-16 pb-24">
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/25 text-emerald-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Code → Diagram
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-6">
            Turn structure into<br />
            diagrams with code.
          </h1>
          <p className="text-lg text-white/45 leading-relaxed mb-10 max-w-md">
            Write simple LayerScript and instantly visualize systems, flows, and ideas. No dragging. No friction.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-600 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-px"
            >
              Start Building
              <ArrowRight size={16} />
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 font-medium transition-all duration-200">
              View Demo
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <CodeBlock />
          <div className="rounded-xl bg-white/4 border border-white/10 p-6">
            <p className="text-xs text-white/25 font-mono mb-4">→ generated diagram</p>
            <DiagramSVG />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section 2: Problem ───────────────────────────────────────────────────────
const PROBLEMS = [
  {label: "01", text: "Dragging shapes breaks structure and takes forever."},
  {label: "02", text: "Updating flows means re-drawing everything from scratch."},
  {label: "03", text: "Most tools focus on visuals — not the logic underneath."},
]

function Problem () {
  return (
    <section className="py-28 px-6 border-t border-white/6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-white/25 mb-5">The problem</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white/60 leading-tight mb-14">
          Diagrams are slow to build<br />and hard to maintain.
        </h2>
        <div className="space-y-7">
          {PROBLEMS.map(({label, text}) => (
            <div key={label} className="flex items-start gap-5">
              <span className="text-white/20 font-mono text-sm mt-1 shrink-0">{label}</span>
              <p className="text-lg text-white/40 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 3: Solution ──────────────────────────────────────────────────────
function Solution () {
  return (
    <section className="py-28 px-6 border-t border-white/6">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-emerald-400 mb-5">The solution</p>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-16">
          Layer changes how<br />you build diagrams.
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="flex flex-col">
            <p className="text-xs text-white/25 font-mono mb-3">Input — LayerScript</p>
            <CodeBlock className="flex-1" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs text-white/25 font-mono mb-3">Output — Diagram</p>
            <div className="rounded-xl bg-white/5 border border-white/10 p-6 flex-1 flex items-center justify-center">
              <DiagramSVG />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {n: "01", title: "Write structure", body: "Describe your flow in plain LayerScript. Readable, fast, and precise."},
            {n: "02", title: "Get the diagram", body: "Layer parses your code and lays out the diagram automatically."},
            {n: "03", title: "Always in sync", body: "Edit the code, the diagram updates. No disconnected states."},
          ].map(({n, title, body}) => (
            <div key={n}>
              <p className="text-emerald-400 text-xs font-mono mb-3">{n}</p>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 4: How It Works ──────────────────────────────────────────────────
const STEPS = [
  {n: "1", title: "Write LayerScript", desc: "Open the code panel. Use `=>` to connect nodes and define your flow."},
  {n: "2", title: "Diagram is generated", desc: "Layer parses the code and renders an auto-laid-out diagram instantly."},
  {n: "3", title: "Explore on canvas", desc: "Pan, zoom, and reposition the entire structure on the infinite canvas."},
]

function HowItWorks () {
  return (
    <section className="py-28 px-6 border-t border-white/6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-white/25 mb-5">How it works</p>
        <h2 className="text-4xl font-bold mb-16">Three steps. That's it.</h2>
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-7 left-0 right-0 h-px bg-white/10 w-9/12 z-0" />

          {STEPS.map(({n, title, desc}) => (
            <div key={n} className="relative z-10">
              <div className="w-14 h-14 rounded-2xl border border-white/15 bg-black flex items-center justify-center mb-6 font-mono font-bold text-xl text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                {n}
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 5: Tools ─────────────────────────────────────────────────────────
const TOOLS = [
  {Icon: Square, title: "Shapes", desc: "Rectangle, circle, and text — the building blocks for every system or flow."},
  {Icon: GitBranch, title: "Connectors", desc: "Connect any two shapes visually. Connectors auto-adjust as you move things."},
  {Icon: Code2, title: "LayerScript Panel", desc: "Write code to generate diagrams. Structure is always reflected in the output."},
  {Icon: Move, title: "Canvas Interaction", desc: "Pan across the canvas, zoom in and out, and drag the entire generated layout."},
  {Icon: Copy, title: "Context Actions", desc: "Copy, paste, and delete shapes directly on the canvas for fast iteration."},
]

function Tools () {
  return (
    <section className="py-28 px-6 border-t border-white/6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-white/25 mb-5">Built-in tools</p>
        <h2 className="text-4xl font-bold mb-4">Everything you need on the canvas.</h2>
        <p className="text-white/40 mb-14 max-w-lg text-base">
          A focused set of tools — built specifically for diagramming, not everything else.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map(({Icon, title, desc}) => (
            <div
              key={title}
              className="rounded-xl border border-white/8 bg-white/3 p-6 hover:border-white/15 hover:bg-white/5 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/6 flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 transition-colors duration-200">
                <Icon size={18} className="text-white/40 group-hover:text-emerald-400 transition-colors duration-200" />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 6: Why Different ─────────────────────────────────────────────────
const DIFFERENTIATORS = [
  {Icon: Layers, title: "Structure-first", body: "You define the logic. Layer builds the layout."},
  {Icon: Zap, title: "Fast iteration", body: "Changing a flow is a one-line edit, not a canvas reorganization."},
  {Icon: Code2, title: "Built for thinkers", body: "If you think in code, Layer speaks your language."},
  {Icon: MousePointer, title: "No messy diagrams", body: "Auto-layout keeps everything clean and aligned. Always."},
]

function WhyDifferent () {
  return (
    <section className="py-28 px-6 border-t border-white/6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-emerald-400 mb-5">Why Layer</p>
        <h2 className="text-4xl font-bold mb-16">Built for structure, not just looks.</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          {DIFFERENTIATORS.map(({Icon, title, body}) => (
            <div key={title}>
              <div className="mb-4">
                <Icon size={22} className="text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 7: Final CTA ─────────────────────────────────────────────────────
function FinalCTA () {
  const navigate = useNavigate()
  return (
    <section className="py-36 px-6 border-t border-white/6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Start building diagrams<br />with structure.
        </h2>
        <p className="text-white/40 text-lg mb-10">
          No setup. Just open the canvas and start writing.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-0.5"
        >
          Create Your First Canvas
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home () {
  return (
    <div className="bg-black text-white min-h-screen">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Tools />
      <WhyDifferent />
      <FinalCTA />
      <footer className="py-8 px-6 border-t border-white/6 text-center">
        <p className="text-white/20 text-sm">© 2026 Layer. Canvas-based diagramming for structured thinkers.</p>
      </footer>
    </div>
  )
}