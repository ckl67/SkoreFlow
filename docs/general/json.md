# Définition formelle du JSON

Le standard JSON (RFC 8259) définit un document JSON comme : Une valeur JSON

Et une valeur JSON peut être :

- un objet
- un tableau
- une string
- un nombre
- un booléen
- null

Donc un **objet** JSON est un type parmi d’autres.

**JSON** = JavaScript Object Notation n'est pas forcément un **objet**

Le terme JSON est dérivé de la syntaxe des objets en JavaScript

Par exmple JSON n'a pas de format date !!

## Grammaire

Ces 6 documents sont tous du JSON valide :

Objet

```go
{ "name": "Christian" }
```

Tableau

```go
[1, 2, 3]
```

String

```go
"hello"
```

Nombre

```go
42
```

Booléen

```go
true
```

Null

```go
null
```

Ils respectent tous la grammaire JSON.

## Grammaire JSON (simplifiée)

Un document JSON est défini comme :

JSON-text = value

Donc :

Un document JSON = une valeur

🔎 Et qu’est-ce qu’une value ?
value =
false
| null
| true
| object
| array
| number
| string

👉 L’objet est juste un des cas possibles.

## Cas le plus courant REST

En backend moderne (Go, Gin, REST), on renvoie presque toujours Une valeur JSON **objet**

- Objets → { }
- Paires clé / valeur

```go
{
"data": ...
}
```

Mais ce n’est qu’une convention d’API, pas une règle du format.
C’est un format d’échange de données textuel, standardisé (RFC 8259), utilisé massivement dans les API REST.

En Go, il est manipulé via le package standard :

```go
import "encoding/json"
```

# Structure fondamentale API REST

JSON objet au niveau API REST

## Exemple 1

```go
{
  "name": "Christian",
  "age": 42,
  "admin": true
}
```

## Exemple 2

```go
{
"name": "Christian",
"roles": ["admin", "editor"]
}
```

Ici :

- racine = objet { }
- roles = tableau [ ]
- chaque élément du tableau est une string

## Règles ABSOLUES sur les guillemets

# Les CLÉS sont TOUJOURS entre guillemets doubles

{
"name": "Christian"
}

❌ Faux :

{
name: "Christian"
}

Pourquoi ?
Parce que le standard JSON exige que les clés soient des chaînes de caractères, donc entre ".

# Les VALEURS dépendent de leur type

- String → entre guillemets doubles
  "name": "Christian"
  Toujours " " Jamais ' ' (le JSON n’accepte pas les quotes simples)

- Nombre → sans guillemets
  "age": 42
  ❌ Faux :
  "age": "42"

Ici ce serait une string, pas un nombre.

- Booléen → sans guillemets
  "admin": true
  ❌ Faux :
  "admin": "true"

- Null → sans guillemets
  "deleted_at": null

- Tableau
  "roles": ["admin", "editor"]
  Chaque élément string reste entre guillemets.

- Objet imbriqué

```go
"user": {
"id": 1,
"name": "Christian"
}
```

## Exemple backend classique :

```go
type User struct {
ID uint32 `json:"id"`
Name string `json:"name"`
Age int `json:"age"`
}
```

Le tag :

```go
`json:"name"`
```

signifie :

👉 quand on sérialise en JSON, la clé sera "name"

Si tu fais :

json.Marshal(user)

On obtient :

```go
{
"id": 1,
"name": "Christian",
"age": 42
}
```

## time.Time

time.Time en Go + JSON, c’est le point sensible classique en backend.

On va le décortiquer proprement.

### Ce qu’est time.Time

time.Time est un type struct du package standard :

import "time"
Il représente :
date
heure
fuseau horaire
précision nanoseconde

### Comment Go sérialise time.Time en JSON

Quand on fait :

```go
json.Marshal(obj)
```

Un time.Time est automatiquement converti en string RFC3339.

Exemple :

type User struct {
CreatedAt time.Time `json:"created_at"`
}

Résultat JSON :

{
"created_at": "2026-03-01T10:15:30Z"
}

Important :

- c’est une string
- format RFC3339
- ce n’est pas un timestamp Unix

### Format exact utilisé

Par défaut :

2006-01-02T15:04:05Z07:00

Exemple avec fuseau :

"2026-03-01T11:15:30+01:00"
4️⃣ Pourquoi ça casse souvent côté backend
🔴 Cas 1 — Le frontend envoie un mauvais format

Frontend envoie :

```go
{
"created_at": "01/03/2026"
}
```

Go attend RFC3339 → erreur :

parsing time "01/03/2026" as "2006-01-02T15:04:05Z07:00": cannot parse
🔴 Cas 2 — Le frontend envoie un timestamp Unix

```go
{
"created_at": 1709293200
}
```

Mais ta struct attend :

CreatedAt time.Time

Erreur :

cannot unmarshal number into Go struct field of type time.Time

### Pourquoi time.Time est une string en JSON ?

Parce que JSON ne possède pas de type "date".

Il n’existe que :

- string
- number
- boolean
- null
- object
- array

Donc une date est représentée comme string.

6️⃣ Cas spécial : champ vide

Supposons :

```go
type User struct {
DeletedAt time.Time `json:"deleted_at,omitempty"`
}
```

Si la valeur est zéro (time.Time{}), JSON donne :

```go
"0001-01-01T00:00:00Z"
```

Ce qui est souvent indésirable.

### Bonne pratique : utiliser un pointeur

```go
type User struct {
DeletedAt \*time.Time `json:"deleted_at,omitempty"`
}
```

Si la valeur est nil → le champ disparaît du JSON.

### Cas GORM (dans ton backend)

GORM ajoute souvent :

CreatedAt time.Time
UpdatedAt time.Time
DeletedAt gorm.DeletedAt

### Bonne pratique côté frontend

Convertir en ISO 8601 complet :

```java
const date = new Date(dateValue)
const isoDate = date.toISOString()
console.log(isoDate)
```

Résultat : 2026-03-01T00:00:00.000Z
Payload envoyé au backend

```java
{
  "title": "Nocturne Op.9",
  "release_date": "2026-03-01T00:00:00Z"
}
```

Backend Go (Gin)

```go
Struct
type CreateSheetRequest struct {
    Title       string    `json:"title"`
    ReleaseDate time.Time `json:"release_date"`
}
```

Controller

```go
func CreateSheet(c *gin.Context) {
    var req CreateSheetRequest

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    fmt.Println(req.ReleaseDate)
}
```

# Ecriture acceptée en Javascript

```java
// 1. Moderne (Shorthand) - Le plus utilisé
data: { email, password }

// 2. Classique (Sans guillemets)
data: { email: email, password: password }

// 3. Ultra-explicite (Avec guillemets)
data: { "email": email, "password": password }
```
