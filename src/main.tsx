import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { BrowserRouter } from 'react-router-dom'




createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <BrowserRouter> 
         <App />
     </BrowserRouter>
  </StrictMode>,
)
