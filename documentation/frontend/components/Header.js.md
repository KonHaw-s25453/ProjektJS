# Dokumentacja: Header.js

## Opis ogólny
Plik `Header.js` definiuje komponent nagłówka aplikacji. Wyświetla logo, linki nawigacyjne i przyciski logowania/wylogowania w zależności od stanu autentyfikacji. Używa hooka `useAuth` do dostępu do danych użytkownika.

## Struktura pliku
- Import: `useAuth` z AuthContext.
- Komponent funkcyjny `Header`.
- Render: Nagłówek z logo i nawigacją warunkową.

## Szczegółowe wyjaśnienia linii

### Linia 1: Import
```javascript
import { useAuth } from './AuthContext'
```
- Importuje hook `useAuth` z lokalnego kontekstu autentyfikacji.

### Linie 3-5: Deklaracja komponentu i hook
```javascript
export default function Header() {
  const { user, logout, isAuthenticated } = useAuth()
```
- Eksport domyślny komponentu funkcyjnego.
- Wyciąga z kontekstu: `user` (dane użytkownika), `logout` (funkcja wylogowania), `isAuthenticated` (boolean czy zalogowany).

### Linie 7-32: Render JSX
```javascript
return (
  <header className="site-header">
    <div className="container header-inner">
      <div className="logo-section">
        <a href="/" className="home-link">Strona główna</a>
        <a href="https://vcvrack.com/" className="logo">
          <img src="/pobrane.png" alt="VCV Rack" style={{ height: '40px' }} />
        </a>
      </div>
      <nav>
        {isAuthenticated ? (
          <>
            <a href="/account" className="btn">Konto</a>
            <a href="/upload" className="btn">Upload Patch</a>
            {user.role === 'admin' && <a href="/admin" className="btn">Admin</a>}
            <span className="user-info">Witaj, {user.username}!</span>
            <button onClick={logout} className="btn btn-ghost">Wyloguj</button>
          </>
        ) : (
          <>
            <a href="/login" className="btn">Zaloguj</a>
            <a href="/register" className="btn btn-ghost">Zarejestruj</a>
          </>
        )}
      </nav>
    </div>
  </header>
)
```
- `<header className="site-header">`: Główny element nagłówka z klasą CSS.
- `<div className="container header-inner">`: Kontener z klasami dla layoutu.
- `<div className="logo-section">`: Sekcja logo.
  - `<a href="/" className="home-link">Strona główna</a>`: Link do strony głównej.
  - `<a href="https://vcvrack.com/" className="logo">`: Link zewnętrzny do VCV Rack.
    - `<img src="/pobrane.png" alt="VCV Rack" style={{ height: '40px' }} />`: Obraz logo, wysokość 40px.
- `<nav>`: Element nawigacji.
  - Warunkowe renderowanie na podstawie `isAuthenticated`:
    - Jeśli zalogowany (`true`):
      - `<a href="/account" className="btn">Konto</a>`: Link do konta.
      - `<a href="/upload" className="btn">Upload Patch</a>`: Link do uploadu.
      - `{user.role === 'admin' && <a href="/admin" className="btn">Admin</a>}`: Link do panelu admin tylko dla roli 'admin'.
      - `<span className="user-info">Witaj, {user.username}!</span>`: Powitanie z nazwą użytkownika.
      - `<button onClick={logout} className="btn btn-ghost">Wyloguj</button>`: Przycisk wylogowania, wywołuje `logout`.
    - Jeśli niezalogowany (`false`):
      - `<a href="/login" className="btn">Zaloguj</a>`: Link do logowania.
      - `<a href="/register" className="btn btn-ghost">Zarejestruj</a>`: Link do rejestracji.

## Użycie w aplikacji
- Importowany i używany w stronach Next.js (np. w `_app.js` lub bezpośrednio w komponentach).
- Przykład: `<Header />` na każdej stronie dla spójnej nawigacji.

## Potencjalne problemy
- Jeśli `useAuth` nie jest w AuthProvider, rzuci błąd.
- `user.role` może być undefined – sprawdzenie `=== 'admin'` zapobiega błędom.
- CSS klasy (np. `btn`, `btn-ghost`) muszą być zdefiniowane w stylach.