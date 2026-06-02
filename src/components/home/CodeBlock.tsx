export default function CodeBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-foreground/5 border border-border p-6 font-mono text-sm ${className}`}>
      <div className="flex items-center gap-1.5 mb-5">
        <div className="w-3 h-3 rounded-full bg-foreground/15" />
        <div className="w-3 h-3 rounded-full bg-foreground/15" />
        <div className="w-3 h-3 rounded-full bg-foreground/15" />
        <span className="ml-3 text-foreground/25 text-xs">layerscript</span>
      </div>
      <div className="space-y-2 leading-relaxed">
        <div className="flex gap-4">
          <span className="text-foreground/20 select-none w-4">1</span>
          <span><span className="text-primary">User</span><span className="text-foreground/40"> =&gt; </span><span className="text-foreground">Login</span></span>
        </div>
        <div className="flex gap-4">
          <span className="text-foreground/20 select-none w-4">2</span>
          <span><span className="text-foreground">Login</span><span className="text-foreground/40"> =&gt; </span><span className="text-foreground">Dashboard</span></span>
        </div>
        <div className="flex gap-4 mt-4">
          <span className="text-foreground/20 select-none w-4">3</span>
          <span className="text-foreground/20">{"// diagram auto-generates ↓"}</span>
        </div>
      </div>
    </div>
  )
}
