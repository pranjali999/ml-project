import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PredictionProvider } from './context/PredictionContext.jsx'
import { HistoryProvider } from './context/HistoryContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <HistoryProvider>
          <PredictionProvider>
            <App />
          </PredictionProvider>
        </HistoryProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
