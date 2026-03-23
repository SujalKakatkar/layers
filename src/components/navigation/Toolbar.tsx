import {Circle, MousePointer2, Pen, Redo, Square, TypeOutline, Undo} from "lucide-react"
import type {LucideIcon} from 'lucide-react'
import type {HelperTools, Tools} from "../../types/types"

type ToolbarProps = {
  onToolChange: (tool: Tools) => void
  activeTool: Tools
  onUndo: () => void,
  onRedo: () => void
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

function Toolbar ({onToolChange, activeTool, onUndo, onRedo}: ToolbarProps) {

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
    <div className="w-[25rem] h-12 bg-zinc-900/60 backdrop-blur-md border border-zinc-700 rounded-xl flex justify-center gap-5 items-center shadow-lg">
      <ul className="text-white p-1 flex  gap-5">
        {icons.map((item) => {
          const Icon = item.icon
          const isActive = activeTool === item.tool

          return (
            <li key={item.name}>
              <button
                onClick={() => onToolChange(item.tool)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition
          ${isActive ? "bg-theme-muted text-white" : "text-zinc-300 hover:bg-zinc-900"}`}
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
      <ul className="text-white p-1 flex  gap-5">
        {helper.map((tool) => {
          const Icon = tool.icon
          return (
            <li key={tool.name}>
              <button
                onClick={tool.name === "undo" ? onUndo : onRedo}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition hover:bg-zinc-900"
              ><Icon
                  size={18}
                  strokeWidth={2}
                /></button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Toolbar
