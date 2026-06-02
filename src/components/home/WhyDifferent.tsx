import { Layers, Zap, Code2, MousePointer } from "lucide-react"

const DIFFERENTIATORS = [
  {Icon: Layers, title: "Structure-first", body: "You define the logic. Layer builds the layout."},
  {Icon: Zap, title: "Fast iteration", body: "Changing a flow is a one-line edit, not a canvas reorganization."},
  {Icon: Code2, title: "Built for thinkers", body: "If you think in code, Layer speaks your language."},
  {Icon: MousePointer, title: "No messy diagrams", body: "Auto-layout keeps everything clean and aligned. Always."},
]

export default function WhyDifferent() {
  return (
    <section className="py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary mb-5">Why Layer</p>
        <h2 className="text-4xl font-bold mb-16">Built for structure, not just looks.</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          {DIFFERENTIATORS.map(({Icon, title, body}) => (
            <div key={title}>
              <div className="mb-4">
                <Icon size={22} className="text-primary" />
              </div>
              <h3 className="text-foreground font-semibold mb-2">{title}</h3>
              <p className="text-foreground/40 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
