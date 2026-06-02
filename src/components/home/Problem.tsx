const PROBLEMS = [
  {label: "01", text: "Dragging shapes breaks structure and takes forever."},
  {label: "02", text: "Updating flows means re-drawing everything from scratch."},
  {label: "03", text: "Most tools focus on visuals — not the logic underneath."},
]

export default function Problem() {
  return (
    <section className="py-28 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-foreground/25 mb-5">The problem</p>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground/60 leading-tight mb-14">
          Diagrams are slow to build<br />and hard to maintain.
        </h2>
        <div className="space-y-7">
          {PROBLEMS.map(({label, text}) => (
            <div key={label} className="flex items-start gap-5">
              <span className="text-foreground/20 font-mono text-sm mt-1 shrink-0">{label}</span>
              <p className="text-lg text-foreground/40 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
