import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { HapticsProvider } from './context/HapticsContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <HapticsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HapticsProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
