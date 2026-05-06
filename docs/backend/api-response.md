# Skoreflow API Response Standard

## Overview

To ensure consistency across the Skoreflow ecosystem, all API responses follow the Envelope Pattern.
This means every response, whether a success or an error, shares a common root structure.

## Base Structure (Go)

The backend uses a unified APIResponse struct to wrap all data.

```Go

type APIResponse struct {
  Success bool `json:"success"` // Always present: true or false
  Data interface{} `json:"data,omitempty"` // Present on success
  Error *APIError `json:"error,omitempty"` // Present on failure
}

type APIError struct {
  Message string `json:"message"` // Human-readable error message
}


func SUCCESS(c *gin.Context, status int, data interface{}) {
	c.JSON(status, APIResponse{
		Success: true,
		Data:    data,
	})
}

func FAIL(c *gin.Context, status int, err error) {
	c.JSON(status, APIResponse{
		Success: false,
		Error: &APIError{
			Message: msg,
		},
	})
}

```

## Response Formats

### ✅ Success Response

When an operation is successful, the server returns a 2xx status code. [HTTP Status Codes](./general/http_status_codes.md)
The data is nested inside the data key.

- **HTTP Response Header**
- **Status:** `HTTP/1.1 200 OK`
- **Content-Type:** `application/json`
- **Cache-Control:** `max-age=604800`
- **Response Body**

```JSON

{
"success": true,
    "data": {
        "id": "123",
        "username": "user1"
      }
}
```

### ❌ Error Response

When an error occurs, the server returns a 4xx or 5xx status code.
The data field is omitted, and the error object is populated.

- **HTTP Response Header**
- **Status:** `HTTP Status: 400 Bad Request`
- **Content-Type:** `application/json`
- **Cache-Control:** `max-age=604800`
- **Response Body**

```JSON

{
  "success": false,
    "error": {
      "message": "username is required"
    }
}
```

## Frontend Implementation (Axios Guide)

It is important to distinguish between the HTTP Response Object (from Axios) and the API Body (from our Go server).

### The "data.data" nesting

Axios automatically wraps the HTTP response body in a property called **.data.**
Since our API also uses a .data property for the payload, the access pattern in the frontend will be:
In other words "status:" and "data:" are coming from axios !

```TypeScript

// Example using Axios
const response = await axios.post('/auth/register', userData);

// 1. response.status -> 200 (HTTP Level)
// 2. response.data -> { success: true, data: {...} } (The JSON Envelope)
// 3. response.data.data -> The actual user object (The Payload)

if (response.data.success) {
const user = response.data.data;
console.log("Welcome,", user.username);
}
```

### Handling Errors in Frontend (Axios)

Axios handle the error differently !!!
When the API returns an error code (4xx or 5xx), Axios throws an exception.
You must catch it to access the error details.
**error** is the object exception of Axios (containing the infos of the request : network, ...etc.).

```TypeScript

try {
  const response = await axios.post('/auth/register', userData);
} catch (error) {
  // 1. error.response.status -> 400 (HTTP Level)
  // 2. error.response.data   -> { success: false, error: { message: "..." } }
  // 3. error.response.data.error.message -> "username is required"

  console.error("Error API:", error.response.data.error.message);
}
```
