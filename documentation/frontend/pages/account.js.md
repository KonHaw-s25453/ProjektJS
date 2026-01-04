# Dokumentacja: pages/account.js

## Opis ogólny
Plik `account.js` to strona konta użytkownika w Next.js. Sprawdza autentyfikację, pobiera dane użytkownika i jego patche, wyświetla profil i listę patchy.

## Struktura pliku
- Importy: useEffect, useState, useRouter, Header.
- Stan: user, patches.
- useEffect: Sprawdza token, pobiera dane.
- JSX: Header, main z danymi user i listą patches.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-4: Importy
```javascript
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
```
- Hooks i komponenty.

### Linie 6-9: Stan
```javascript
const [user, setUser] = useState(null)
const [patches, setPatches] = useState([])
const router = useRouter()
```
- user: Dane użytkownika.
- patches: Lista patchy użytkownika.

### Linie 11-32: useEffect
```javascript
useEffect(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  // Pobierz dane użytkownika
  fetch('/api/user', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
    if (data.user) setUser(data.user)
    else router.push('/login')
  })
  .catch(() => router.push('/login'))

  // Pobierz patchy użytkownika
  fetch('/patches?user=true', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setPatches(data.patches || []))
}, [])
```
- Sprawdza token w localStorage, przekierowuje na /login jeśli brak.
- Pobiera user z /api/user, patches z /patches?user=true.
- Jeśli błąd, przekierowuje.

### Linie 34-59: JSX
Wyświetla Header, dane user (nazwa, email, rola), listę patchy z linkami, link do upload.

## Użycie
- Ścieżka: /account
- Wymaga logowania.

## Potencjalne problemy
- Fetch: Błędy API – przekierowanie na login.
- localStorage: Jeśli niedostępny, błąd.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\pages\account.js.md