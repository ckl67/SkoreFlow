# Public vs Protected API

Public resources and authenticated resources must use different endpoints, even if they expose similar data. This avoids cache pollution, CORS inconsistencies, and authentication state transitions (login/logout) causing browsers to reuse incompatible cached responses.
