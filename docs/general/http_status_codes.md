🌐 Common HTTP Status Codes

✅ 2xx — Success
| Code | Name | Description |
| ---- | ---------- | ----------------------------------------------------- |
| 200 | OK | The request succeeded. |
| 201 | Created | A new resource was successfully created. |
| 202 | Accepted | The request has been accepted but not yet processed. |
| 204 | No Content | The request succeeded, but there is no response body. |

🔁 3xx — Redirection
| Code | Name | Description |
| ---- | ----------------- | ------------------------------------------------------------ |
| 301 | Moved Permanently | The resource has been permanently moved to a new URL. |
| 302 | Found | The resource is temporarily located at a different URL. |
| 304 | Not Modified | The resource has not changed since the last request (cache). |

❌ 4xx — Client Errors
| Code | Name | Description |
| ---- | -------------------- | ------------------------------------------------------------- |
| 400 | Bad Request | The request is malformed or invalid. |
| 401 | Unauthorized | Authentication is required or failed. |
| 403 | Forbidden | The client does not have permission. |
| 404 | Not Found | The requested resource could not be found. |
| 405 | Method Not Allowed | The HTTP method is not supported for this resource. |
| 409 | Conflict | The request conflicts with the current state of the resource. |
| 422 | Unprocessable Entity | The request is well-formed but contains semantic errors. |
| 429 | Too Many Requests | The client has sent too many requests in a given time. |

💥 5xx — Server Errors
| Code | Name | Description |
| ---- | --------------------- | ------------------------------------------------------- |
| 500 | Internal Server Error | A generic server-side error occurred. |
| 501 | Not Implemented | The server does not support the functionality required. |
| 502 | Bad Gateway | Invalid response from an upstream server. |
| 503 | Service Unavailable | The server is temporarily unavailable. |
| 504 | Gateway Timeout | The upstream server failed to respond in time. |
