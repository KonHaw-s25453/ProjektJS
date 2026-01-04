# Dokumentacja: pages/index.js

## Opis ogólny
Plik `index.js` to strona główna aplikacji Next.js. Ładuje listę patchy z API `/patches`, obsługuje wyszukiwanie, wyświetla komponenty Hero, SearchBar, PatchList. W przypadku błędu pokazuje przykładowe dane.

## Struktura pliku
- Importy: Head, useEffect, useState, komponenty.
- Stan: patches, loading, error.
- Funkcje: onSearch, useEffect do ładowania.
- JSX: Head, Header, main z Hero, SearchBar, PatchList.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-5: Importy
```javascript
import Head from 'next/head'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SearchBar from '../components/SearchBar'
import PatchList from '../components/PatchList'
```
- Head: Dla meta tagów.
- Hooks: useEffect, useState.
- Komponenty: Header, Hero, SearchBar, PatchList.

### Linie 7-10: Stan
```javascript
const [patches, setPatches] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
```
- patches: Lista patchy.
- loading: Flaga ładowania.
- error: Komunikat błędu.

### Linie 12-25: onSearch
```javascript
const onSearch = async (query) => {
  setLoading(true)
  setError(null)
  try {
    const res = await fetch(`/patches?query=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Search error')
    const data = await res.json()
    setPatches(data.patches || data || [])
  } catch (e) {
    setError(e.message)
    // Keep current patches or fallback
  } finally {
    setLoading(false)
  }
}
```
- Funkcja dla SearchBar: Wysyła GET /patches?query=...
- Aktualizuje patches wynikami wyszukiwania.

### Linie 27-47: useEffect
```javascript
useEffect(() => {
  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/patches')
      if (!res.ok) throw new Error('Network error')
      const data = await res.json()
      setPatches(data.patches || data || [])
    } catch (e) {
      // fallback: simple mock data so prototype works without backend
      setError(e.message)
      setPatches([
        { id: 1, user_name: 'anon', description: 'Przykładowy patch', uploaded_at: '2025-12-21', file_path: '', category_id: null },
        { id: 2, user_name: 'demo', description: 'Inny patch', uploaded_at: '2025-12-20', file_path: '', category_id: null }
      ])
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])
```
- Ładuje patche przy montowaniu.
- Jeśli błąd, pokazuje przykładowe dane.

### Linie 49-71: JSX
Renderuje stronę z Head, Header, main zawierającym Hero, SearchBar, sekcję z loading/error/PatchList.

## Użycie
- Domyślna strona Next.js: /
- Wymaga działającego backendu dla patchy.

## Potencjalne problemy
- Fetch: Błędy sieciowe – fallback do mock data.
- API: Jeśli /patches zwraca inny format, dostosować data.patches.
- SSR: useEffect działa po stronie klienta.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\pages\index.js.md