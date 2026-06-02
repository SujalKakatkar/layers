const STEPS = [
  {n: "1", title: "Write LayerScript", desc: "Open the code panel. Use `=>` to connect nodes and define your flow."},
  {n: "2", title: "Diagram is generated", desc: "Layer parses the code and renders an auto-laid-out diagram instantly."},
  {n: "3", title: "Explore on canvas", desc: "Pan, zoom, and reposition the entire structure on the infinite canvas."},
]

export default function HowItWorks() {
  return (
    <section className="py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-foreground/25 mb-5">How it works</p>
        <h2 className="text-4xl font-bold mb-16">Three steps. That's it.</h2>
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-7 left-0 right-0 h-px bg-foreground/10 w-9/12 z-0" />

          {STEPS.map(({n, title, desc}) => (
            <div key={n} className="relative z-10">
              <div className="w-14 h-14 rounded-2xl border border-border bg-background flex items-center justify-center mb-6 font-mono font-bold text-xl text-primary shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                {n}
              </div>
              <h3 className="text-foreground font-semibold text-lg mb-3">{title}</h3>
              <p className="text-foreground/40 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
