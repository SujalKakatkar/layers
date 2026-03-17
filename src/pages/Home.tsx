import {ArrowRight} from "lucide-react"
import {Button} from "../components/ui/button"
import {useNavigate} from "react-router"

function Home () {
  const navigate = useNavigate()
  return (
    <div className=' min-h-screen flexbox'>
      <main className=" flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-5xl md:text-6xl font-extrabold leading-tight max-w-4xl">
          Collaborate. Create. Visualize.
        </h2>
        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl">
          A powerful online whiteboard to brainstorm ideas, design systems,
          and build your thoughts visually in real time.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button onClick={() => navigate('/dashboard')} className=" flex items-center gap-1">
            Try Layer
            <ArrowRight size={20} />
          </Button>
        </div>

        {/* Preview Card */}
        {/* <div className="mt-16 w-full max-w-5xl bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6">
          <div className="h-64 md:h-80 rounded-xl bg-gradient-to-br from-indigo-500/30 to-pink-500/30 flex items-center justify-center text-slate-200 text-xl">
            <Whiteboard/>
          </div>
        </div> */}
      </main>
    </div>
  )
}

export default Home
