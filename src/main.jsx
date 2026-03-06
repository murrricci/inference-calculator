import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Calc from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Calc />
  </StrictMode>,
)
