# Production PDF Loading Issue: Missing Leading Slash in `VITE_API_URL`

## Problem

PDF files loaded correctly on the local development server but failed when the application was deployed behind Nginx in production.

The browser console showed PDF.js warnings such as:

```text
Warning: getHexString - ignoring invalid character: 33
Warning: getHexString - ignoring invalid character: 111
Warning: getHexString - ignoring invalid character: 116
Warning: getHexString - ignoring invalid character: 121
```

At first, these warnings suggested that PDF.js might be receiving an invalid or corrupted PDF.

However, the PDF itself was valid.

---

## Investigation

### 1. Verify the PDF through Nginx

The production endpoint was tested directly:

```bash
curl -I https://skoreflow-app.com/api/v1/demo/scores/3/file
```

The response was:

```text
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 52676
```

The first bytes of the response were also checked:

```bash
curl -s https://skoreflow-app.com/api/v1/demo/scores/3/file \
  | head -c 20 | xxd
```

Result:

```text
00000000: 2550 4446 2d31 2e34 0a33 2030 206f 626a  %PDF-1.4.3 0 obj
00000010: 0a3c 3c2f                                .</
```

The response therefore started with the expected PDF signature:

```text
%PDF-1.4
```

The same result was obtained when accessing the backend directly:

```bash
curl -s http://localhost:8080/api/v1/demo/scores/3/file \
  | head -c 20 | xxd
```

This confirmed that both the backend and Nginx were serving the correct PDF.

---

## 2. Validate the PDF itself

The file was downloaded from the production endpoint:

```bash
curl -sk https://skoreflow-app.com/api/v1/demo/scores/3/file \
  -o /tmp/score3.pdf
```

`file` reported:

```text
PDF document, version 1.4, 2 page(s)
```

`pdfinfo` confirmed:

```text
Pages:           2
File size:       52676 bytes
PDF version:     1.4
Encrypted:       no
```

Finally:

```bash
qpdf --check /tmp/score3.pdf
```

reported:

```text
No syntax or stream encoding errors found
```

Therefore, the PDF was valid and was not corrupted during transmission.

---

## 3. Inspect the Blob received by the browser

The frontend uses Axios with:

```ts
responseType: 'blob';
```

and creates an object URL:

```ts
const blob = await getScoreFile(id);
const objectURL = URL.createObjectURL(blob);
```

A temporary debug log was added:

```ts
console.log('PDF blob:', {
  type: blob.type,
  size: blob.size,
});

console.log('PDF header:', JSON.stringify(await blob.slice(0, 20).text()));
```

The result was:

```text
PDF blob: {
  type: "text/html",
  size: 765
}
```

The response body was:

```html
<!doctype html>
<html lang="en">
  ...
  <title>SkoreFlow</title>
  ...
</html>
```

This was the key discovery.

The browser was **not receiving the PDF at all**. It was receiving the application's `index.html`.

---

## 4. Find the actual URL used by Axios

The frontend configuration is:

```ts
apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1';
```

The binary request builds the final URL with:

```ts
url: config.apiUrl + url;
```

For example:

```ts
config.apiUrl + '/demo/scores/3/file';
```

A temporary log was added:

```ts
console.log('API URL:', config.apiUrl);
console.log('FULL URL:', config.apiUrl + url);
```

The production log showed:

```text
(apiBinaryRequest) method url = api/v1/demo/scores/3/file
```

The important detail is the missing leading `/`.

The application was generating:

```text
api/v1/demo/scores/3/file
```

instead of:

```text
/api/v1/demo/scores/3/file
```

---

## Root Cause

The production Vite environment variable was missing the leading slash.

Incorrect:

```env
VITE_API_URL=api/v1
```

Correct:

```env
VITE_API_URL=/api/v1
```

Because this is a Vite `VITE_*` variable, its value is injected into the frontend bundle **at build time**.

Therefore, changing `.env` alone is not sufficient. The frontend must be rebuilt and redeployed.

---

## Why the Browser Received `index.html`

With the incorrect value:

```text
api/v1/demo/scores/3/file
```

the URL was relative rather than root-relative.

The request therefore did not reach the Nginx API location:

```nginx
location /api/ {
    proxy_pass http://localhost:8080;
    ...
}
```

Instead, it was handled by the frontend location:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Since the requested path did not correspond to a frontend asset, Nginx returned:

```text
/index.html
```

The browser therefore received:

```text
Content-Type: text/html
```

instead of:

```text
Content-Type: application/pdf
```

PDF.js subsequently attempted to parse the HTML document as a PDF, which produced the misleading `getHexString` warnings.

---

## Correction

The production `.env` must contain:

```env
VITE_API_URL=/api/v1
```

After changing the variable, the frontend must be rebuilt and redeployed:

```bash
sudo su - skoreflow
cd /opt/skoreflow
bash .scripts/deploy.sh
```

The reason for the rebuild is that Vite replaces `import.meta.env.VITE_API_URL` during the build process. The browser does not read the `.env` file directly.

---

## Expected Result

After the rebuild, the frontend should generate:

```text
/api/v1/demo/scores/3/file
```

instead of:

```text
api/v1/demo/scores/3/file
```

The browser should then receive:

```text
Content-Type: application/pdf
```

with a Blob similar to:

```text
PDF blob: {
    type: "application/pdf",
    size: 52676
}
```

The PDF object URL can then be passed normally to PDF.js:

```ts
pdfjsLib.getDocument(fileURL);
```

No changes to the PDF viewer, PDF.js configuration, backend, or Nginx proxy configuration are required.

---

## Diagnostic Lesson

When a binary resource works through `curl` but fails in the browser, it is useful to inspect the **actual response received by the browser**, not only the response returned by the server.

In this case:

```text
Server → PDF              OK
Nginx → PDF               OK
Browser → Blob            HTML
```

The difference immediately pointed to a URL construction problem in the frontend.

A particularly useful diagnostic is:

```ts
console.log({
  url: config.apiUrl + endpoint,
  type: blob.type,
  size: blob.size,
});
```

For binary resources, the expected MIME type should also be checked. A PDF request returning:

```text
text/html
```

is a strong indication that the request did not reach the intended API endpoint.
