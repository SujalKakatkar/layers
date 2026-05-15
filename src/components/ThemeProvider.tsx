import React, {createContext, useEffect, useState, useContext} from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({children}: {children: React.ReactNode}) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem("theme") as Theme | null
        if(saved) return saved

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
    })

    useEffect(() => {
        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark")
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    const ctx = useContext(ThemeContext)
    if(!ctx) throw new Error("useTheme must be used inside ThemeProvider")
    return ctx
}
