import React from 'react'
import {ThemeProvider} from '../components/ThemeProvider'

function Providers ({children}: {children: React.ReactNode}) {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    )
}

export default Providers
