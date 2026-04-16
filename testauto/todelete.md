# Test Manuel - Mise en garde

En Bash, les variables à l'intérieur de '...' ne sont pas interprétées
La solution : Utilise des doubles guillemets "...".

```shell
# Plutôt que
curl -s -w '\n%{http_code}' -X PUT http://localhost:8080/api/sheet/$name -H 'Authorization: Bearer $TOKEN_USER2' ...

# Préférer

curl -v -X PUT "http://localhost:8080/api/sheet/$name" -H "Authorization: Bearer $TOKEN_USER2" ....
```

Exécuter la commande auto-test va aussi mettre en place un contexte, qui va permettre de créer un contexte database + fichier
Il est possible d'arrêter l'autotest et de passer dans le mode de codage avec air !

# Test Manuel - Quelques commandes manuels

## Login

```Shell
TOKEN_USER1=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user1@test.com","password":"password123"}' | jq -r '.token')

TOKEN_USER2=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user2.updated@test.com","password":"password123"}' | jq -r '.token')

```

Un JWT = 3 parties Base64URL séparées par des points : **HEADER.PAYLOAD.SIGNATURE**

"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3JpemVkIjp0cnVlLCJleHAiOjE3NzEyNzM3NzksInVzZXJfaWQiOjZ9.BcgkGDIjwe6qfcNz_k4YDSU0yJuqSsZxrqMWCFYgKRQ"

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.
eyJhdXRob3JpemVkIjp0cnVlLCJleHAiOjE3NzEyNzAxMjcsInVzZXJfaWQiOjZ9
.
GmN6ksFwjMq63Y3DaMv62IS8NsnxbhO3awWaX5rVPU4

👉 Le payload est lisible sans la clé secrète.

```Shell
echo "eyJhdXRob3JpemVkIjp0cnVlLCJleHAiOjE3NzI2NDI2MDMsInJvbGUiOjAsInVzZXJfaWQiOjF9" | base64 -d
{"authorized":true,"exp":1775304140,"role":1,"user_id":3}
```

## Profil

```Shell
curl -H "Authorization: Bearer $TOKEN_USER1" http://localhost:8080/api/profile | jq
```

## Même chose : Profil dans le contexte de test

```Shell
cmd="curl -s -w '\n%{http_code}' -H \"Authorization: Bearer $TOKEN_USER1\" http://localhost:8080/api/profile"
response=$(eval "$cmd")
echo "$response"
```

# Chargement partition

On entoure toujours les valeurs complexes par des guillemets simples dans le curl :
C'est uniquement parce que tu tapes la commande manuellement dans ton terminal Linux avec curl que le point-virgule pose problème, car pour le terminal, ; signifie "Fin de la commande".
Avec react nous pourrons laisser le point virgule

```shell
curl -X POST "http://localhost:8080/api/sheet/upload \
 -H 'Authorization: Bearer $TOKEN' \
 -F 'sheetName=Sonate au Clair de Lune' \
 -F 'composer=Ludwig Van Beethoven' \
 -F 'releaseDate=2024-01-01' \
 -F 'categories=Classical,Romantic' \
 -F 'tags=Piano,Doux' \
 -F 'informationText=Une magnifique pièce de Beethoven.' \
 -F 'uploadFile=@./moonlight-sonata.pdf'"
```

# List de partition

```Shell
################
# Avec GET
################
# Lister les partitions (GET simple)
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?page=1&limit=5" | jq

# Liste triée alphabétiquement
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?page=1&limit=10&sort=sheet_name%20asc" | jq

# Liste triée par date de création
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?page=1&limit=10&sort=created_at%20desc" | jq

# Filtrer par compositeur
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?page=1&limit=10&composer=Mozart" | jq

# Filtrer par tag
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?page=1&limit=10&tag=Piano" | jq

#Filtrer par catégorie
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?page=1&limit=10&category=Classical" | jq

#Recherche textuelle
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?page=1&limit=10&search=Nocturne" | jq

################
# Avec POST
################

# Lister les partitions (GET simple)
curl -X POST \
-H "Authorization: Bearer $TOKEN_USER1" \
-H "Content-Type: application/json" \
-d '{"page":1,"limit":5}' \
"http://localhost:8080/api/sheets" | jq

# Liste triée alphabétiquement
curl -X POST \
-H "Authorization: Bearer $TOKEN_USER1" \
-H "Content-Type: application/json" \
-d '{"page":1,"limit":10,"sort":"sheet_name asc"}' \
"http://localhost:8080/api/sheets" | jq

# Liste triée par date de création
curl -X POST \
-H "Authorization: Bearer $TOKEN_USER1" \
-H "Content-Type: application/json" \
-d '{"page":1,"limit":10,"sort":"created_at desc"}' \
"http://localhost:8080/api/sheets" | jq

# Filtrer par compositeur
curl -X POST \
-H "Authorization: Bearer $TOKEN_USER1" \
-H "Content-Type: application/json" \
-d '{"page":1,"limit":10,"composer":"Mozart"}' \
"http://localhost:8080/api/sheets" | jq

# Filtrer par tag
curl -X POST \
-H "Authorization: Bearer $TOKEN_USER1" \
-H "Content-Type: application/json" \
-d '{"page":1,"limit":10,"tag":"Piano"}' \
"http://localhost:8080/api/sheets" | jq

#Filtrer par catégorie
curl -X POST \
-H "Authorization: Bearer $TOKEN_USER1" \
-H "Content-Type: application/json" \
-d '{"page":1,"limit":10,"category":"Classical"}' \
"http://localhost:8080/api/sheets" | jq

#Recherche textuelle
curl -X POST \
-H "Authorization: Bearer $TOKEN_USER1" \
-H "Content-Type: application/json" \
-d '{"page":1,"limit":10,"search":"Nocturne"}' \
"http://localhost:8080/api/sheets" | jq

```

# Manipulation des partitions

Le principe retenu est de faire une recherche d'une partition à travers plusieurs critères, puis d'utiliser l'ID de la partition pour
la manipuler

## Principe de Recherche de la partition avec extraction de l'ID

```shell

  curl -s -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheets?limit=1" | jq -r

  #renvoie
  {
    "limit": 10,
    "page": 1,
    "rows": [
      {
        "id": 6,
        "safe_sheet_name": "nocturne-opus-9-n2",
        "sheet_name": "Nocturne Opus 9 N2",
        ...
      },
      {
        "id": 5,
        "safe_sheet_name": "logical-song",
        ...
      }
    ]
  }

  # Extraction id
  SHEET_ID=$(curl -s -H "Authorization: Bearer $TOKEN_USER2"  "http://localhost:8080/api/sheets?search=Logical" | jq -r '.rows[0].id')

  echo "L'ID de la partition est : $SHEET_ID"
```

Quand on écrit .rows[0].id, tu donnes un itinéraire à jq :

- .rows : "Cherche la clé nommée rows à la racine du JSON" (C'est un tableau []).
- [0] : "Prend le premier élément de ce tableau" (Le premier objet partition).
- .id : "Dans cet objet, donne-moi la valeur du champ id.
- Sans -r : jq renvoie "6" (avec les guillemets).
- Avec -r : jq renvoie 6(texte pur).

# Détail d'une partition

```shell
curl -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/sheet/7" | jq
curl -H "Authorization: Bearer $TOKEN_USER2" -X GET "http://localhost:8080/api/sheet/7" | jq
```

# Suppression d'une partition

```shell
curl -H "Authorization: Bearer $TOKEN_USER2" -X DELETE "http://localhost:8080/api/sheet/13" | jq
```

# Mettre à jour une partition

Les champs qui peuvent être mis à jour
IMPORTANT : On ne modifie jamais le SafeSheetName pour préserver l'intégrité du stockage disque.

```shell
	File            *multipart.FileHeader `form:"uploadFile"`
  SheetName       string                `form:"sheetName"`
	ReleaseDate     string                `form:"releaseDate"`
	Categories      string                `form:"categories"`
	Tags            string                `form:"tags"`
	InformationText string                `form:"informationText"`


curl -X PUT \
-H "Authorization: Bearer $TOKEN_USER2" \
-F "sheetName=New Title" \
-F "tags=Pop,Rock" \
"http://localhost:8080/api/sheet/7" | jq

```

# PATCH annotations

```shell
curl -X PATCH \
-H "Authorization: Bearer $TOKEN_USER2" \
-H "Content-Type: application/json" \
-d '{
  "annotations": "[{\"type\":\"circle\",\"x\":150,\"y\":200,\"radius\":20,\"color\":\"red\"}]"
}' \
"http://localhost:8080/api/sheet/7/annotations" | jq

```

# COMPOSERS

## Search a Composer

```shell
TOKEN_USER1=$(curl -s -X POST http://localhost:8080/api/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user1@test.com","password":"password123"}' | jq -r '.token')
```

```shell
curl -s -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/composers?search=Beethoven"
```

## Get a Composer

```shell
curl -s -H "Authorization: Bearer $TOKEN_USER1" "http://localhost:8080/api/composer/1" | jq
```
