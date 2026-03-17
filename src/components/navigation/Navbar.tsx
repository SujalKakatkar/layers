import {BringToFront} from "lucide-react"
import {Button} from "../ui/button"

function Navbar () {
    return (
        <nav className='h-20 w-full z-20  sticky top-0 flexbox'>
            <main className="w-2/3 lg:w-1/2 flex items-center rounded-md bg-theme-muted/50 backdrop-blur-md  px-4 h-15">
                <section className="flex-1 flex gap-2 items-center">
                    <BringToFront />
                    <h1 className="font-bold text-xl">layer</h1>
                </section>
                <section className="space-x-5 flex">
                    <Button variant={"clear"}>Log In</Button>
                    <Button className="hidden lg:block">Try Layer
                    </Button>
                </section>
            </main>
        </nav>
    )
}

export default Navbar
