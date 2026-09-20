# config

## issue

In console log :

```console
The loading of the worker at the address `https://skoreflow-app.com/assets/pdf.worker.min-FHbmGBN0.mjs` has been blocked due to an invalid MIME type
```

mjs is is a compiled and minified JavaScript file that forms part of the PDF.js library (developed by Mozilla) and is used to display PDF files directly in a browser or web application.

The issue is that .mjs is not declared in nginx mime

```shell
# modify
etc/nginx/mime.types

# replace
application/javascript    js;
# with
application/javascript    js mjs;
```

Then

```shell
sudo nginx -t
sudo systemctl reload nginx

curl -I https://skoreflow-app.com/assets/pdf.worker.min-FHbmGBN0.mjs
# should provide
Content-Type: application/javascript

```
