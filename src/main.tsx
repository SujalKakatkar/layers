
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {initAuthListener} from "./lib/initAuth.ts";
import Root from "./Root.tsx";

initAuthListener()

;(async () => {
    try {
        await document.fonts.load("20px 'Patrick Hand'");
        await document.fonts.ready;
    } catch (e) {
        console.warn("Font loading failed", e);
    }
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <Root />
      </StrictMode>,
    )
})();
