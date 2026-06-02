import CodeBlock from "./CodeBlock"
import DiagramSVG from "./DiagramSVG"

export default function Solution() {
  return (
    <section className="py-28 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary mb-5">The solution</p>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-16">
          Layer changes how<br />you build diagrams.
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="flex flex-col">
            <p className="text-xs text-foreground/25 font-mono mb-3">Input — LayerScript</p>
            <CodeBlock className="flex-1" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs text-foreground/25 font-mono mb-3">Output — Diagram</p>
            <div className="rounded-xl bg-foreground/5 border border-border p-6 flex-1 flex items-center justify-center">
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
              <p className="text-primary text-xs font-mono mb-3">{n}</p>
              <h3 className="text-foreground font-semibold text-lg mb-2">{title}</h3>
              <p className="text-foreground/40 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
