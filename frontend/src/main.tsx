import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router';
import { AuthProvider } from './auth/AuthContext';

// Layer 1: <React.StrictMode>
//    This is a development aid(Note: It is automatically disabled in production.)
// Layer 2: <AuthProvider> (The Authentication Context)
//    It encompasses the entire application. As it is at the very top, all pages and components on the site will have access to login information
//    (e.g. determining whether the user is an admin or retrieving their token).
// Layer 3: <RouterProvider router={router} />
//    This is the engine of your application. It checks the browser’s current URL and decides which component (which page) to display.
//    For example, if the URL is /, it will display the Home page.
// In summary
//    "Take the white div 'root' from my HTML page, enable debug mode, set up the system to know who is logged in,
//    check the current URL, and display the correct page inside that div!"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* REACT MECHANICS NOTE:
      Using <AuthProvider>...</AuthProvider> here looks like HTML, but under the hood,
      React compiles this into a standard JavaScript function call:
      👉 AuthProvider({ children: <RouterProvider router={router} /> })
    */}
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
