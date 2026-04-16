🌐 CORS Configuration Guide - SkoreFlow Backend

This document explains the implementation and purpose of the CORS (Cross-Origin Resource Sharing) mechanism within the SkoreFlow Go backend.

# DOM (Document Object Model)

The DOM (Document Object Model) is the bridge between a web page and your code (JavaScript).
Here is the breakdown:

- The Blueprint: When a browser loads your HTML, it creates a "live" map of the page.
- The Tree Structure: It organizes every element (<div>, <h1>, <p>) into a hierarchical tree of objects.
- The Remote Control: JavaScript uses the DOM to change, add, or delete elements on the fly without refreshing the page.

Key Difference:

- HTML: Is the static text file you write.
- DOM: Is the dynamic, interactive version living in the browser's memory.

Summary: The DOM turns your static document into a dynamic object that code can manipulate.

# CORS (Cross-Origin Resource Sharing)

By default, web browsers (DOM) enforce the Same-Origin Policy (SOP).
This security measure prevents a frontend application running on http://localhost:3000 (e.g., React/Vue) from making HTTP requests to a backend on http://localhost:8080 unless the server explicitly allows it.

Without the configuration below, the browser will block backend responses to protect the user from malicious cross-site requests.

## The Dialogue Between the Browser and the Backend

Imagine the Browser is a bodyguard. Your Frontend code (React) wants to enter a club called "Backend Go."

- The Frontend says to the Bodyguard: "Send this POST request to localhost:8080."
- The Browser (the bodyguard) replies: "Hold on. You are coming from localhost:3000, but the club is at 8080. That’s suspicious. I’m going to ask the club first if they allow people from localhost:3000."
  -The Browser sends an OPTIONS request **_(the famous Preflight request)_** to the Backend.
- The Backend (your Go code with the CORS middleware) answers: "Yes, I accept visitors coming from localhost:3000."
- The Browser turns back to the Frontend: "Alright, the club confirmed it's okay. I'm sending your actual POST request now."

It is the which Backend decide about the right !

## Technical Summary

It is a three-party contract:

- Frontend: Requests the resource.
- Backend: Provides the "permission keys" (HTTP Headers like Access-Control-Allow-Origin).
- Browser: Checks if the Backend's keys match the Frontend's origin. If they match, it allows the data to pass through.

**This is why tools like Postman or cURL always work even without CORS: they don't have a "bodyguard" (browser) enforcing web security rules.**

# Implementation in SkoreFlow (Go + Gin)

In this project, CORS is handled via a middleware injected into the Gin router.

```go

// Code Snippet (infrastructure/server.go):


if origin := config.Config().CorsAllowedOrigins; origin != "" {
  server.Router.Use(cors.New(cors.Config{
  AllowOrigins: []string{origin},
  AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"},
  AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
  AllowCredentials: true,
  MaxAge: 12 \* time.Hour,
  }))
}

// Parameter Purpose
//  - AllowOrigins Lists the domains permitted to contact the API (e.g., http://localhost:3000).
//  - AllowMethods Defines which HTTP verbs are allowed (GET, POST, etc.).
//  - AllowHeaders Permits specific headers like Authorization (essential for JWT tokens).
//  - AllowCredentials Allows the exchange of cookies or authentication headers between front and back.
//  - MaxAge Tells the browser how long (12h) to cache the "Preflight" response. 3. Configuration via Environment Variables

```

The server retrieves authorized origins through the "config.go" file or CORS_ALLOWED_ORIGINS environment variable.

```Bash

# In your .env file or local environment:
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Production:
You must specify the actual URL of the deployed application:

CORS_ALLOWED_ORIGINS=https://app.skoreflow.com
```

## The Request Flow (Preflight)

For complex requests (those using Authorization or Content-Type: application/json), the browser performs a two-step process:

- OPTIONS (Preflight): The browser asks the server: "Do you allow this origin to perform this action?"
- Actual Request: If the server responds with the correct headers (handled by our middleware), the browser proceeds with the real request (GET/POST/etc.).
- Troubleshooting Tip: If you see a "CORS policy" error in your browser console, double-check that the URL in the error message matches the one in your CORS_ALLOWED_ORIGINS variable exactly (watch out for trailing slashes / or http vs https mismatches).
