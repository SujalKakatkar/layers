import { Code2, GitBranch, Layers, BookOpen, Terminal } from "lucide-react"
import { useNavigate } from "react-router"

// ─── Syntax Highlighter ───────────────────────────────────────────────────────
function highlightTokens(text: string) {
  if (!text) return null;
  const regex = /(=>|\[|\]|\(|\))/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part === '=>') return <span key={index} className="text-primary font-bold">{'=>'}</span>;
    if (part === '[' || part === ']') return <span key={index} className="text-lime-400">{part}</span>;
    if (part === '(' || part === ')') return <span key={index} className="text-cyan-400">{part}</span>;
    return <span key={index} className="text-muted-foreground">{part}</span>;
  });
}

function highlightLayerScript(code: string) {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
      const beforeComment = line.substring(0, commentIndex);
      const comment = line.substring(commentIndex);
      return (
        <div key={i} className="min-h-[1.5em]">
          {highlightTokens(beforeComment)}
          <span className="text-muted-foreground italic">{comment}</span>
        </div>
      );
    }
    return <div key={i} className="min-h-[1.5em]">{highlightTokens(line)}</div>;
  });
}

// ─── Code Block Component ───────────────────────────────────────────────────
function CodeBlock ({ code, title }: { code: string, title?: string }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border overflow-hidden my-6">
      {title && (
        <div className="bg-foreground/5 border-b border-border px-4 py-2 flex items-center gap-2">
          <Terminal size={14} className="text-foreground/40" />
          <span className="text-xs font-mono text-foreground/50">{title}</span>
        </div>
      )}
      <div className="p-6 font-mono text-[13px] overflow-x-auto">
        <pre className="text-foreground/80 leading-relaxed">
          <code>{highlightLayerScript(code)}</code>
        </pre>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function LearnLayers () {
  const navigate = useNavigate()

  const demoCode = `// --- Simple Chain ---
Start => Process => End

// --- Types of Nodes ---
[Rectangle Node] => (Circle Node)
Default Node => [Another Rectangle]

// --- Multiple Outputs (Branching) ---
Main Router => Route 1
Main Router => Route 2
Main Router => (Route 3)

// --- Multiple Inputs (Merging) ---
Data Source A => [Data Processor]
Data Source B => [Data Processor]

// --- Complex Flow ---
[User Login] => (Auth Service)
(Auth Service) => Success
(Auth Service) => [Error Page]
Success => [Dashboard]
[Dashboard] => (Fetch Data)
(Fetch Data) => Render View`

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      
      {/* Header Spacer (assuming navbar is sticky and transparent) */}
      <div className="h-24"></div>

      <main className="max-w-4xl mx-auto px-6 py-12 pb-32">
        
        {/* Header Section */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 text-primary text-xs font-medium mb-6 bg-primary/5">
            <BookOpen size={14} />
            Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Learn LayerScript
          </h1>
          <p className="text-xl text-foreground/50 leading-relaxed max-w-2xl">
            A simple, text-based domain-specific language (DSL) for generating beautiful architecture diagrams and flowcharts instantly.
          </p>
        </div>

        {/* Section: What is LayerScript? */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Layers className="text-primary" size={24} />
            What is LayerScript?
          </h2>
          <div className="prose prose-invert prose-emerald max-w-none">
            <p className="text-foreground/60 text-lg leading-relaxed mb-6">
              LayerScript is designed for thinkers. Instead of dragging shapes and wrestling with arrows, you simply define the relationships between your components using text. The Layer engine automatically parses your code, assigns a hierarchy, and lays out the diagram using a depth-first search algorithm.
            </p>
            <p className="text-foreground/60 text-lg leading-relaxed">
              When you edit the code, the diagram updates in real-time. You can still pan, zoom, and select the generated layout on the infinite canvas, combining the speed of code with the spatial context of a whiteboard.
            </p>
          </div>
        </section>

        <hr className="border-border my-16" />

        {/* Section: Syntax Guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Code2 className="text-primary" size={24} />
            Syntax Guide
          </h2>
          
          <div className="space-y-12">
            
            {/* Shapes */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-foreground/90">Defining Shapes</h3>
              <p className="text-foreground/60 mb-4">You can define different types of nodes by wrapping text in specific characters.</p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-foreground/5 border border-border rounded-xl p-5">
                  <div className="text-primary font-mono text-sm mb-2">Default (Rectangle)</div>
                  <code className="text-foreground text-lg">Just Text</code>
                </div>
                <div className="bg-foreground/5 border border-border rounded-xl p-5">
                  <div className="text-primary font-mono text-sm mb-2">Explicit Rectangle</div>
                  <code className="text-foreground text-lg">[Text in Brackets]</code>
                </div>
                <div className="bg-foreground/5 border border-border rounded-xl p-5">
                  <div className="text-primary font-mono text-sm mb-2">Circle</div>
                  <code className="text-foreground text-lg">(Text in Parens)</code>
                </div>
              </div>
            </div>

            {/* Connections */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-foreground/90">Making Connections</h3>
              <p className="text-foreground/60 mb-4">Use the <code className="bg-foreground/10 px-2 py-0.5 rounded text-primary">=&gt;</code> operator to connect nodes. You can chain them together for faster writing.</p>
              <CodeBlock 
                title="example.layer"
                code={`Node A => Node B
Node B => Node C

// Or chain them:
Node A => Node B => Node C`} />
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-foreground/90">Comments</h3>
              <p className="text-foreground/60 mb-4">Use standard JavaScript-style line comments to organize your code.</p>
              <CodeBlock 
                code={`// This is a comment and will be ignored by the engine
Start => End`} />
            </div>

          </div>
        </section>

        <hr className="border-border my-16" />

        {/* Section: Comprehensive Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <GitBranch className="text-primary" size={24} />
            Comprehensive Example
          </h2>
          <p className="text-foreground/60 text-lg mb-6">
            Here is a complete example demonstrating chaining, branching, multiple inputs, and different node types. Try pasting this into your canvas!
          </p>
          <CodeBlock title="demo_architecture.layer" code={demoCode} />
          <div className="flex justify-end mt-4">
             <button
               onClick={() => navigator.clipboard.writeText(demoCode)}
               className="text-sm px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-lg transition-colors text-foreground/70 hover:text-foreground"
             >
               Copy Code
             </button>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-24 p-8 rounded-2xl bg-primary/10 border border-primary/20 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to start building?</h3>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">
            Head over to your dashboard to create a new canvas and start writing LayerScript.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary text-primary-foreground font-bold transition-all"
          >
            Go to Dashboard
          </button>
        </div>

      </main>
    </div>
  )
}
