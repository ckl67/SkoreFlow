import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router';
import { AuthProvider } from './auth/AuthProvider';

// -------------------------------------------
// REACT MECHANICS NOTE:
// -------------------------------------------
// Layer 1: <React.StrictMode>
//    This is a development aid(Note: It is automatically disabled in production.)
// Layer 2: <AuthProvider> (The Authentication Context)
//    It encompasses the entire application. As it is at the very top,
//    all pages and components on the site will have access to login information
//    (e.g. determining whether the user is an admin or retrieving their token).
// Layer 3: <RouterProvider router={router} />
//    This is the engine of your application. It checks the browser’s current URL and decides which component (which page) to display.
//    For example, if the URL is /, it will display the Home page.
// -------------------------------------------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
