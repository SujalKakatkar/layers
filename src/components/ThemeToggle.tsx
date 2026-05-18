import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import {Button} from "./ui/button";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant={'ghost'}
            onClick={toggleTheme}
            className="w-10 h-10 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
    );
}