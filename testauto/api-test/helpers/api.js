async function request(method, url, { token, data, headers } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  let responseData;
  try {
    responseData = await res.json();
  } catch {
    responseData = await res.text();
  }

  return {
    status: res.status,
    data: responseData,
  };
}

module.exports = { request };
