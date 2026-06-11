# Test

## Install

Make sur you have [Mock Service Worker](https://mswjs.io/docs/)

```shell
npm install msw --save-dev -w frontend
# or equivalent
npm install -D msw -w frontend
```

## For testing

```shell
# from the root
npm uninstall -D @testing-library/react @testing-library/dom @testing-library/user-event -w frontend
npm uninstall -D @testing-library/jest-dom -w frontend
npm uninstall -D jsdom -w frontend

```
