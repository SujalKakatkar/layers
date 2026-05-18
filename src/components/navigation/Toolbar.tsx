import { Circle, MousePointer2, Pen, Redo, Square, TypeOutline, Undo, CodeXml, BookOpen } from "lucide-react"
import type { LucideIcon } from 'lucide-react'
import type { HelperTools, Tools } from "../../types/types"
import { Link } from "react-router"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { ThemeToggle } from "../ThemeToggle"

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
  shortcut?: string
}

type HelperToolItems = (baseItems & {
  tool: HelperTools
})[]

type ToolbarItems = (baseItems & {
  tool: Tools
})[]

function Toolbar({ onToolChange, activeTool, onUndo, onRedo, isCodePanelOpen, onToggleCodePanel }: ToolbarProps) {

  const icons: ToolbarItems = [
    {
      icon: MousePointer2,
      name: 'Pointer',
      tool: "select",
      shortcut: 'V'
    },
    {
      icon: Square,
      name: 'Rectangle',
      tool: "rectangle",
      shortcut: 'R'

    },
    {
      icon: Circle,
      name: 'Circle',
      tool: "circle",
      shortcut: 'C'

    }
    , {
      icon: Pen,
      name: "Pen",
      tool: "pen",
      shortcut: 'P'

    },
    {
      icon: TypeOutline,
      name: 'Text',
      tool: "text",
      shortcut: 'T'
    }

  ]

  const helper: HelperToolItems = [
    {
      name: "Undo",
      icon: Undo,
      tool: "undo",
      shortcut: 'Ctrl+Z'
    },
    {
      name: "Redo",
      icon: Redo,
      tool: "redo",
      shortcut: 'Ctrl+Shift+Z'
    }
  ]

  return (
    <div className="w-fit px-3 h-14 bg-muted/60 backdrop-blur-md border border-border rounded-2xl flex justify-center gap-2 items-center shadow-lg">
      <ul className="text-foreground p-1 flex gap-2">
        {icons.map((item) => {
          const Icon = item.icon
          const isActive = activeTool === item.tool

          return (
            <li key={item.name}>
              <Tooltip>
                <TooltipTrigger render={<button
                  onClick={() => onToolChange(item.tool)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition
                ${isActive ? "active-tool-glow text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    fill={isActive ? "currentColor" : "none"}
                  />
                </button>}>

                </TooltipTrigger>
                <TooltipContent side="top" className="flex items-center gap-2 px-2.5 py-1.5">
                  <span className="font-medium">{item.name}</span>
                  <kbd className="px-1.5 py-0.5 rounded-md  text-[10px] text-black font-mono bg-primary">{item.shortcut}</kbd>
                </TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ul>

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1" />

      <ul className="text-muted-foreground p-1 flex gap-2">
        {helper.map((tool) => {
          const Icon = tool.icon
          return (
            <li key={tool.name}>
              <Tooltip>
                <TooltipTrigger render={
                  <button
                    onClick={tool.name === "Undo" ? onUndo : onRedo}
                    className="w-10 h-10 flex items-center justify-center rounded-xl transition hover:bg-muted hover:text-foreground"
                  >
                    <Icon size={20} strokeWidth={2} />
                  </button>
                }>

                </TooltipTrigger>
                <TooltipContent side="top" className="flex items-center gap-2 px-2.5 py-1.5">
                  <span className="font-medium">{tool.name}</span>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-foreground/10 text-[10px] font-mono ">{tool.shortcut}</kbd>
                </TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ul>

      {/* Code Toggle */}
      <div className="w-px h-6 bg-border mx-1" />
      <div className="text-muted-foreground p-1 flex gap-2 items-center">
        <Tooltip>
          <TooltipTrigger render={<Link
            to="/learn"
            className="w-10 h-10 flex items-center justify-center rounded-xl transition text-primary/80 hover:bg-primary/10 hover:text-primary"
          >
            <BookOpen size={20} strokeWidth={2} />
          </Link>}>

          </TooltipTrigger>
          <TooltipContent side="top" className="px-2.5 py-1.5 font-medium">
            Learn LayerScript
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<button
            onClick={onToggleCodePanel}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition
              ${isCodePanelOpen ? "bg-theme-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <CodeXml size={20} strokeWidth={2} />
          </button>}>

          </TooltipTrigger>
          <TooltipContent side="top" className="px-2.5 py-1.5 font-medium">
            Toggle Code Panel
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger render={<ThemeToggle />}>
          </TooltipTrigger>
          <TooltipContent side="top" className="px-2.5 py-1.5 font-medium">
            Toggle Theme
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default Toolbar
