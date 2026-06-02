export default function DiagramSVG() {
  return (
    <svg viewBox="0 0 420 130" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="100" height="48" rx="8" className="fill-foreground/5 stroke-border" strokeWidth="1.5" />
      <text x="60" y="69" textAnchor="middle" className="fill-foreground" fontSize="13" fontWeight="500" fontFamily="Figtree Variable, sans-serif">User</text>
      <line x1="110" y1="64" x2="153" y2="64" className="stroke-primary" strokeWidth="1.5" />
      <polygon points="147,59 158,64 147,69" className="fill-primary" />
      <rect x="160" y="40" width="100" height="48" rx="8" className="fill-foreground/5 stroke-border" strokeWidth="1.5" />
      <text x="210" y="69" textAnchor="middle" className="fill-foreground" fontSize="13" fontWeight="500" fontFamily="Figtree Variable, sans-serif">Login</text>
      <line x1="260" y1="64" x2="303" y2="64" className="stroke-primary" strokeWidth="1.5" />
      <polygon points="297,59 308,64 297,69" className="fill-primary" />
      <rect x="310" y="40" width="100" height="48" rx="8" className="fill-foreground/5 stroke-border" strokeWidth="1.5" />
      <text x="360" y="69" textAnchor="middle" className="fill-foreground" fontSize="11" fontWeight="500" fontFamily="Figtree Variable, sans-serif">Dashboard</text>
    </svg>
  )
}
