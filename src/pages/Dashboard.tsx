import {LogOut, Plus} from "lucide-react"
import {useEffect, useState} from "react"
import {useNavigate} from "react-router"
import {Button} from "../components/ui/button"
import {Separator} from "../components/ui/separator"

type Canvas = {
  id: string
  title: string
  createdAt: number
}

function Dashboard () {

  const [canvases, setCanvases] = useState<Canvas[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem("canvases")
    if(stored) {
      setCanvases(JSON.parse(stored))
    }
  }, [])

  function createCanvas () {

    const newCanvas: Canvas = {
      id: crypto.randomUUID(),
      title: "Untitled Canvas",
      createdAt: Date.now()
    }

    const updated = [...canvases, newCanvas]

    setCanvases(updated)

    localStorage.setItem("canvases", JSON.stringify(updated))

    navigate(`/canvas/${newCanvas.id}`)
  }

  return (
    <div className=" flex justify-center ">
      <div className="px-2 sm:min-w-2xl xl:min-w-6xl ">
        {/* user details */}
        <section className="h-15 px-4 rounded-xl flex items-center my-2">
          <div className="flex-1">
            <h1 className="">username</h1>

          </div>
          <div>
            <Button size={"icon"} variant={"bordered"}>
              <LogOut />
            </Button>
          </div>
        </section>

        <Separator />

        <section className="py-3">
          <button
            onClick={createCanvas}
            className="bg-theme-accent h-[10rem] w-[15rem] text-white flex items-center justify-center px-4 py-2 rounded"
          >
            <Plus />
            Create Canvas
          </button>

          <div className="mt-6 space-y-2">

            {canvases.map(canvas => (
              <div
                key={canvas.id}
                onClick={() => navigate(`/canvas/${canvas.id}`)}
                className="p-4 border rounded cursor-pointer hover:bg-gray-100"
              >
                {canvas.title}
              </div>
            ))}

          </div>

        </section>
      </div>
    </div>
  )
}

export default Dashboard