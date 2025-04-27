import React from 'react'
import ReactDOM from 'react-dom/client'
<% if (needRouter) { %>
import { BrowserRouter } from 'react-router-dom'
<% } %>
import App from './App.<%= ext %>'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <% if (needRouter) { %>
    <BrowserRouter>
    <% } %>
      <App />
    <% if (needRouter) { %>
    </BrowserRouter>
    <% } %>
  </React.StrictMode>
)