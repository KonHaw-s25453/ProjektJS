# Dokumentacja: RegisterForm.js

## Opis ogólny
Plik `RegisterForm.js` to komponent React formularza rejestracji dla aplikacji Next.js. Wysyła POST do `/register`, obsługuje walidację (hasła, potwierdzenie), błędy, sukces i stan ładowania. Po sukcesie przekierowuje na stronę logowania.

## Struktura pliku
- Importy: useState, useRouter.
- Stan: formData, loading, error, success.
- Funkcje: handleChange, handleSubmit.
- JSX: Formularz z polami username/password/confirmPassword, przyciskiem, linkiem do logowania.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-3: Importy
```javascript
import { useState } from 'react'
import { useRouter } from 'next/router'
```
- useState: Stan formularza, loading, error, success.
- useRouter: Przekierowanie po rejestracji.

### Linie 5-13: Stan komponentu
```javascript
const [formData, setFormData] = useState({
  username: '',
  password: '',
  confirmPassword: ''
})
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [success, setSuccess] = useState('')
const router = useRouter()
```
- formData: Obiekt z username, password, confirmPassword.
- loading: Flaga dla przycisku i pól.
- error/success: Komunikaty.
- router: Do przekierowania.

### Linie 15-22: handleChange
Podobny do LoginForm – aktualizuje formData, czyści błąd.

### Linie 24-70: handleSubmit
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setSuccess('')

  // Validation
  if (!formData.username || !formData.password || !formData.confirmPassword) {
    setError('Wszystkie pola są wymagane')
    return
  }

  if (formData.password !== formData.confirmPassword) {
    setError('Hasła nie są identyczne')
    return
  }

  if (formData.password.length < 6) {
    setError('Hasło musi mieć co najmniej 6 znaków')
    return
  }

  setLoading(true)

  try {
    const res = await fetch('/register', {
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
      throw new Error(data.error || 'Błąd rejestracji')
    }

    setSuccess('Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.')
    setFormData({ username: '', password: '', confirmPassword: '' })

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```
- Walidacja: Wszystkie pola, hasła identyczne, min 6 znaków.
- Wysyła POST do /register.
- Po sukcesie: Wiadomość sukcesu, czyści formularz, przekierowuje na /login po 2s.

### Linie 72-142: JSX
Formularz z trzema polami, przyciskiem, błędami/sukcesem, linkiem do logowania.

## Użycie
- W `pages/register.js`: `<RegisterForm />`

## Potencjalne problemy
- Walidacja: Hasła niepasujące, krótkie hasło.
- Fetch: Błędy sieciowe, duplikaty username (serwer zwraca błąd).
- Przekierowanie: Opóźnienie 2s dla wiadomości sukcesu.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\components\RegisterForm.js.md