# Dokumentacja: pages/upload.js

## Opis ogólny
Plik `upload.js` to strona uploadu patcha w Next.js. Formularz do wyboru pliku .vcv, kategorii, opisu, wysyła do /upload.

## Struktura pliku
- Importy: useState, useRouter, Header.
- Stan: file, category, description, loading, error.
- handleSubmit: Wysyła FormData.
- JSX: Header, form z inputami.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-4: Importy
```javascript
import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
```

### Linie 6-11: Stan
```javascript
const [file, setFile] = useState(null)
const [category, setCategory] = useState('')
const [description, setDescription] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
const router = useRouter()
```

### Linie 13-35: handleSubmit
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!file) return setError('Wybierz plik .vcv')
  setLoading(true)
  setError(null)

  const formData = new FormData()
  formData.append('vcv', file)
  formData.append('category', category)
  formData.append('description', description)

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData,
      // Add auth header if needed
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    alert('Patch uploaded successfully!')
    router.push('/')
  } catch (e) {
    setError(e.message)
  } finally {
    setLoading(false)
  }
}
```
- Walidacja pliku.
- FormData z plikiem i polami.
- POST do /upload.
- Sukces: alert, przekierowanie na /.

### Linie 37-65: JSX
Formularz z input file, text, textarea, button, error.

## Użycie
- Ścieżka: /upload
- Wymaga logowania (backend sprawdza).

## Potencjalne problemy
- Auth: Brak Authorization header – backend może wymagać.
- File: Tylko .vcv, ale walidacja po stronie klienta słaba.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\pages\upload.js.md