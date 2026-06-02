import { Square, GitBranch, Code2, Move, Copy } from "lucide-react"

const TOOLS = [
  {Icon: Square, title: "Shapes", desc: "Rectangle, circle, and text — the building blocks for every system or flow."},
  {Icon: GitBranch, title: "Connectors", desc: "Connect any two shapes visually. Connectors auto-adjust as you move things."},
  {Icon: Code2, title: "LayerScript Panel", desc: "Write code to generate diagrams. Structure is always reflected in the output."},
  {Icon: Move, title: "Canvas Interaction", desc: "Pan across the canvas, zoom in and out, and drag the entire generated layout."},
  {Icon: Copy, title: "Context Actions", desc: "Copy, paste, and delete shapes directly on the canvas for fast iteration."},
]

export default function Tools() {
  return (
    <section className="py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-foreground/25 mb-5">Built-in tools</p>
        <h2 className="text-4xl font-bold mb-4">Everything you need on the canvas.</h2>
        <p className="text-foreground/40 mb-14 max-w-lg text-base">
          A focused set of tools — built specifically for diagramming, not everything else.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map(({Icon, title, desc}) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-foreground/3 p-6 hover:border-border hover:bg-foreground/5 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-foreground/6 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors duration-200">
                <Icon size={18} className="text-foreground/40 group-hover:text-primary transition-colors duration-200" />
              </div>
              <h3 className="text-foreground font-semibold text-base mb-2">{title}</h3>
              <p className="text-foreground/40 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
