import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let activeTheme: "light" | "dark" | null = null;

export function setActiveTheme(theme: "light" | "dark" | null) {
  activeTheme = theme;
}

export function getThemeColor() {
  const theme = activeTheme;
  if (theme) {
    return theme === "dark" ? "white" : "#0f172a";
  }
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark") ? "white" : "#0f172a";
  }
  return "white";
}

export function getThemeBgColor() {
  const theme = activeTheme;
  if (theme) {
    return theme === "dark" ? "#09090b" : "white";
  }
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark") ? "#09090b" : "white";
  }
  return "#09090b";
}
