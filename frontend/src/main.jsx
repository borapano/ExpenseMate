import { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

const root = document.getElementById('root')
if (!root) throw new Error("Root element not found")

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <ScrollToTop />
    <App />
  </BrowserRouter>
)