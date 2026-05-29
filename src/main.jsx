import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { ApiStatusProvider } from './context/ApiStatusContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ApiStatusProvider>
        <App />
      </ApiStatusProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)


