import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import {Button} from "./ui/button";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant={'ghost'}
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-text hover:bg-bg/50 transition"
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
    );
}