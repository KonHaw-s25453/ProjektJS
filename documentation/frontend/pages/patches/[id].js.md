# Dokumentacja: pages/patches/[id].js

## Opis ogólny
Plik `[id].js` to dynamiczna strona szczegółów patcha w Next.js. Wyświetla dane patcha, pozwala na dodawanie notatek/tagów, pobieranie pliku, usuwanie (dla właściciela/admina).

## Struktura pliku
- Importy: useEffect, useState, useRouter, Header, useAuth.
- Stan: patch, notes, newNote, tags, newTag.
- useEffect: Pobiera dane patcha.
- Funkcje: addNote, addTag, deletePatch, downloadPatch.
- JSX: Szczegóły patcha, przyciski, listy notatek/tagów, formularze.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-5: Importy
```javascript
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import { useAuth } from '../../components/AuthContext'
```

### Linie 7-14: Stan
```javascript
const router = useRouter()
const { id } = router.query
const { user } = useAuth()
const [patch, setPatch] = useState(null)
const [notes, setNotes] = useState([])
const [newNote, setNewNote] = useState('')
const [tags, setTags] = useState([])
const [newTag, setNewTag] = useState('')
```

### Linie 16-26: useEffect
Pobiera /patches/{id}, ustawia patch, notes, tags.

### Linie 28-42: addNote
Wysyła POST /patches/{id}/notes, dodaje do stanu.

### Linie 44-56: addTag
Podobnie dla tagów.

### Linie 58-72: deletePatch
DELETE /patches/{id}, potwierdzenie, przekierowanie.

### Linie 74-92: downloadPatch
Pobiera blob, tworzy link do download.

### Linie 94-142: JSX
Wyświetla szczegóły, przyciski warunkowe, listy, formularze.

## Użycie
- Ścieżka: /patches/[id]
- Dynamiczne ID z router.query.

## Potencjalne problemy
- Auth: Funkcje wymagają tokena.
- Uprawnienia: Usuwanie tylko dla właściciela/admina.
- Fetch: Błędy API.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\pages\patches\[id].js.md