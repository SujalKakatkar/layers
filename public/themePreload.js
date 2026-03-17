(() => {
    const saved = localStorage.getItem("theme");

    if(saved === "dark" || saved === "light") {
        document.documentElement.classList.add(saved);
        return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.add(prefersDark ? "dark" : "light");
})();