<!--cspell:ignore qpdf  -->

# pdf.js

## Tools

QPDF is a powerful, free tool that allows you to edit PDF files whilst preserving their content.

sudo apt update
sudo apt install qpdf

## issue

```shell
ls -lh /opt/skoreflow/frontend/dist/assets/pdf.worker*.mjs

file /opt/skoreflow/frontend/dist/assets/pdf.worker*.mjs


curl -I https://skoreflow-app.com/api/v1/demo/scores/3/file

curl -s https://skoreflow-app.com/api/v1/demo/scores/3/file | head -c 20 | xxd

A normal PDF must begin with:

25 50 44 46


curl -s http://localhost:8080/api/v1/demo/scores/3/file | head -c 20 | xxd
# 00000000: 2550 4446 2d31 2e34 0a33 2030 206f 626a  %PDF-1.4.3 0 obj
# 00000010: 0a3c 3c2f                                .<</

curl -sk https://skoreflow-app.com/api/v1/demo/scores/3/file | head -c 20 | xxd
# 00000000: 2550 4446 2d31 2e34 0a33 2030 206f 626a  %PDF-1.4.3 0 obj
# 00000010: 0a3c 3c2f

```
