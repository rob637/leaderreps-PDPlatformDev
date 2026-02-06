import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { AuthProvider } from './providers/AuthProvider';
import { StudyProvider } from './providers/StudyProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StudyProvider>
          <App />
        </StudyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
