import {useState} from 'react'
import Toolbar from '../components/navigation/Toolbar'
import {Outlet} from 'react-router'
import type {HistoryActions, Tools} from '../types/types'
import CodePanel from '../components/ui/CodePanel'

function Canvaslayout () {

    const [tool, setTool] = useState<Tools>("select")
    const [isCodePanelOpen, setIsCodePanelOpen] = useState(false)
    const [historyActions, setHistoryActions] = useState<HistoryActions>({
        undo: () => {},
        redo: () => {}
    })


    return (
        <div className="flex">
            <aside className="fixed bottom-2 left-1/2 -translate-x-1/2  z-50">
                <Toolbar 
                  onToolChange={setTool} 
                  activeTool={tool} 
                  onUndo={historyActions?.undo} 
                  onRedo={historyActions?.redo} 
                  isCodePanelOpen={isCodePanelOpen}
                  onToggleCodePanel={() => setIsCodePanelOpen(!isCodePanelOpen)}
                />
            </aside>

            <CodePanel isOpen={isCodePanelOpen} onClose={() => setIsCodePanelOpen(false)} />

            <main className="flex-1">
                <Outlet context={{tool, setTool, setUndoRedo: setHistoryActions, isCodePanelOpen}} />
            </main>
        </div>
    )
}

export default Canvaslayout
