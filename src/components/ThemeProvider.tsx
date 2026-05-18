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
        const css = document.createElement('style')
        css.appendChild(
            document.createTextNode(
                `* {
                -webkit-transition: none !important;
                -moz-transition: none !important;
                -o-transition: none !important;
                -ms-transition: none !important;
                transition: none !important;
                }`
            )
        )
        document.head.appendChild(css)

        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(theme)
        localStorage.setItem("theme", theme)

        // Force browser to paint the new theme without transition
        window.getComputedStyle(css).opacity

        setTimeout(() => {
            document.head.removeChild(css)
        }, 1)
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
