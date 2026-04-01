
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {initAuthListener} from "./lib/initAuth.ts";
import Root from "./Root.tsx";

initAuthListener()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
