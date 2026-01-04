# Dokumentacja: LoginForm.js

## Opis ogólny
Plik `LoginForm.js` to komponent React formularza logowania dla aplikacji Next.js. Używa kontekstu `useAuth` do logowania, wysyła POST do `/auth/login`, obsługuje walidację, błędy i stan ładowania. Po sukcesie przekierowuje na stronę główną.

## Struktura pliku
- Importy: useState, useRouter, useAuth.
- Stan: formData, loading, error.
- Funkcje: handleChange, handleSubmit.
- JSX: Formularz z polami username/password, przyciskiem, linkiem do rejestracji.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-5: Importy
```javascript
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './AuthContext'
```
- useState: Zarządzanie stanem formularza, loading, error.
- useRouter: Przekierowanie po logowaniu.
- useAuth: Hook do logowania z kontekstu.

### Linie 7-14: Stan komponentu
```javascript
const [formData, setFormData] = useState({
  username: '',
  password: ''
})
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const router = useRouter()
const { login } = useAuth()
```
- formData: Obiekt z username i password.
- loading: Flaga dla przycisku i pól.
- error: Komunikat błędu.
- router: Do przekierowania.
- login: Funkcja z kontekstu.

### Linie 16-23: handleChange
```javascript
const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  })
  // Clear errors when user starts typing
  if (error) setError('')
}
```
- Aktualizuje formData na podstawie inputu.
- Czyści błąd przy pisaniu.

### Linie 25-70: handleSubmit
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')

  // Validation
  if (!formData.username || !formData.password) {
    setError('Nazwa użytkownika i hasło są wymagane')
    return
  }

  setLoading(true)

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Błąd logowania')
    }

    // Use auth context to login
    if (data.token && data.user) {
      login(data.token, data.user)
    }

    // Redirect to home page
    router.push('/')

  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```
- Zapobiega domyślnemu submit.
- Walidacja: Wymaga username i password.
- Wysyła POST do /auth/login z JSON.
- Jeśli błąd, rzuca wyjątek.
- Jeśli sukces, wywołuje login z kontekstu, przekierowuje na /.

### Linie 72-116: JSX
Renderuje formularz z polami, przyciskiem, błędami, linkiem do rejestracji.

## Użycie
- Używany w `pages/login.js`: `<LoginForm />`
- Wymaga kontekstu AuthProvider.

## Potencjalne problemy
- Fetch może się nie powieść: Sieć, CORS.
- Błędy: Nieprawidłowe dane, serwer niedostępny.
- Przekierowanie: Jeśli router nie działa, błąd.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\components\LoginForm.js.md