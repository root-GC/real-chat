import React from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore: No declaration file for JS module
import App from './app/App.jsx';
import './styles/global.css';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);