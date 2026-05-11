import {Circle, MousePointer2, Pen, Redo, Square, TypeOutline, Undo, Code, CodeXml, BookOpen} from "lucide-react"
import type {LucideIcon} from 'lucide-react'
import type {HelperTools, Tools} from "../../types/types"

type ToolbarProps = {
  onToolChange: (tool: Tools) => void
  activeTool: Tools
  onUndo: () => void,
  onRedo: () => void
  isCodePanelOpen?: boolean
  onToggleCodePanel?: () => void
}

type baseItems = {
  icon: LucideIcon,
  name: string,
}

type HelperToolItems = (baseItems & {
  tool: HelperTools
})[]

type ToolbarItems = (baseItems & {
  tool: Tools
})[]

function Toolbar ({onToolChange, activeTool, onUndo, onRedo, isCodePanelOpen, onToggleCodePanel}: ToolbarProps) {

  const icons: ToolbarItems = [
    {
      icon: MousePointer2,
      name: 'pointer',
      tool: "select"
    },
    {
      icon: Square,
      name: 'rectangle',
      tool: "rectangle"

    },
    {
      icon: Circle,
      name: 'circle',
      tool: "circle"

    }
    , {
      icon: Pen,
      name: "pen",
      tool: "pen"

    },
    // {
    //   icon: <ArrowUpRight />,
    //   name: "arrow",
    //   handletool: () => onToolChange("arrow")

    // }
    {
      icon: TypeOutline,
      name: 'Text',
      tool: "text"
    }

  ]

  const helper: HelperToolItems = [
    {
      name: "undo",
      icon: Undo,
      tool: "undo"
    },
    {
      name: "redo",
      icon: Redo,
      tool: "redo"
    }
  ]

  return (
    <div className="w-fit px-3 h-12 bg-zinc-900/60 backdrop-blur-md border border-zinc-700 rounded-xl flex justify-center gap-2 items-center shadow-lg">
      <ul className="text-white p-1 flex gap-2">
        {icons.map((item) => {
            const Icon = item.icon
            const isActive = activeTool === item.tool

            return (
              <li key={item.name}>
                <button
                  onClick={() => onToolChange(item.tool)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition
            ${isActive ? "bg-theme-muted text-white" : "text-zinc-300 hover:bg-zinc-800"}`}
                 title={item.name}
                >
                  <Icon
                    size={18}
                    strokeWidth={2}
                    fill={isActive ? "currentColor" : "none"}
                  />
                </button>
              </li>
            )
          })}
      </ul>

      {/* Separator */}
      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <ul className="text-zinc-400 p-1 flex gap-2">
        {helper.map((tool) => {
          const Icon = tool.icon
          return (
            <li key={tool.name}>
              <button
                onClick={tool.name === "undo" ? onUndo : onRedo}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition hover:bg-zinc-800 hover:text-white"
                title={tool.name}
              ><Icon
                  size={18}
                  strokeWidth={2}
                /></button>
            </li>
          )
        })}
      </ul>
      
      {/* Code Toggle */}
      <div className="w-px h-6 bg-zinc-700 mx-1" />
      <div className="text-zinc-400 p-1 flex gap-2">
        <a 
          href="/learn"
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 flex items-center justify-center rounded-lg transition text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-400"
          title="Learn LayerScript"
        >
          <BookOpen size={18} strokeWidth={2} />
        </a>
        <button
          onClick={onToggleCodePanel}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition
          ${isCodePanelOpen ? "bg-theme-muted text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
          title="Code"
        >
          <CodeXml size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
