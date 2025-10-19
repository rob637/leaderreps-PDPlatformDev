// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null, info: null } }
  static getDerivedStateFromError(error){ return { error } }
  componentDidCatch(error, info){ console.error('App crashed:', error, info) }
  render(){
    if (this.state.error) {
      const msg = String(this.state.error?.stack || this.state.error?.message || this.state.error)
      return (
        <pre style={{
          whiteSpace:'pre-wrap', padding:16, background:'#111', color:'#eee',
          minHeight:'100vh', margin:0
        }}>
{msg}
        </pre>
      )
    }
    return this.props.children
  }
}

const container = document.getElementById('root')
if (!container) {
  document.body.innerHTML += '<pre style="padding:16px;background:#111;color:#eee">No #root element found in index.html</pre>'
} else {
  createRoot(container).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
}
