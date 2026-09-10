import React from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const el = document.getElementById('root')
if (el.innerHTML.trim()) {
  hydrateRoot(el, <React.StrictMode><App /></React.StrictMode>)
} else {
  createRoot(el).render(<React.StrictMode><App /></React.StrictMode>)
}
