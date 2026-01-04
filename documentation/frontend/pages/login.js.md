# Dokumentacja: pages/login.js

## Opis ogólny
Plik `login.js` to strona logowania w Next.js. Wyświetla Header i LoginForm dla zalogowania użytkownika.

## Struktura pliku
- Importy: Head, Header, LoginForm.
- Komponent: Login.
- JSX: Head, Header, main z LoginForm.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-3: Importy
```javascript
import Head from 'next/head'
import Header from '../components/Header'
import LoginForm from '../components/LoginForm'
```
- Head: Meta tagi.
- Header: Nagłówek.
- LoginForm: Formularz logowania.

### Linie 5-21: Komponent Login
```javascript
export default function Login() {
  return (
    <>
      <Head>
        <title>Logowanie - VCV Rack Patches</title>
        <meta name="description" content="Zaloguj się do archiwum patchy VCV Rack" />
      </Head>

      <Header />

      <main>
        <LoginForm />
      </main>
    </>
  )
}
```
- Renderuje Head z tytułem i opisem.
- Header na górze.
- Main z LoginForm.

## Użycie
- Ścieżka: /login
- Wymaga AuthProvider w _app.js.

## Potencjalne problemy
- Stylizacja: Wymaga CSS dla main i komponentów.
- Routing: Jeśli nie ma /login w next.config, błąd.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\pages\login.js.md