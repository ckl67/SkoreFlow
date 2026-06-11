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
npm install -D @testing-library/react @testing-library/dom @testing-library/user-event -w frontend
npm install -D @testing-library/jest-dom -w frontend
npm install -D jsdom -w frontend

```

Quand l'utilisateur clique ici
→ l'état React change
→ le composant affiche ceci
→ le bouton devient désactivé
→ le spinner apparaît
→ le message d'erreur apparaît

Faire quelques tests React ciblés :

<AuthContext />
<Login />
<ProtectedRoute />

pour vérifier :

rendu
navigation
contexte

sans forcément mocker toute l'API.
