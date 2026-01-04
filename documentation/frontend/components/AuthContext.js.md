# Dokumentacja: AuthContext.js

## Opis ogólny
Plik `AuthContext.js` definiuje kontekst autentyfikacji dla aplikacji React/Next.js. Używa Context API do zarządzania stanem użytkownika, logowaniem i wylogowaniem. Zapewnia globalny dostęp do danych użytkownika i funkcji autentyfikacji w całej aplikacji.

## Struktura pliku
- Importy: `createContext`, `useContext`, `useState`, `useEffect` z React.
- `AuthProvider`: Komponent provider kontekstu.
- `useAuth`: Hook do używania kontekstu.

## Szczegółowe wyjaśnienia linii

### Linie 1-3: Importy
```javascript
import { createContext, useContext, useState, useEffect } from 'react'
```
- `createContext`: Tworzy kontekst React, który pozwala na przekazywanie danych przez drzewo komponentów bez props drilling.
- `useContext`: Hook do konsumowania kontekstu.
- `useState`: Hook do zarządzania stanem lokalnym (user, loading).
- `useEffect`: Hook do efektów ubocznych (sprawdzenie tokena przy starcie).

### Linia 5: Tworzenie kontekstu
```javascript
const AuthContext = createContext()
```
- Tworzy pusty kontekst. Domyślna wartość to `undefined`, ale zostanie nadpisana przez Provider.

### Linie 7-49: Komponent AuthProvider
```javascript
export function AuthProvider({ children }) {
```
- Eksportowany komponent funkcyjny, który przyjmuje `children` (dzieci komponentów).
- Zawija aplikację w Provider, dostarczając wartość kontekstu.

#### Linie 8-9: Stan komponentu
```javascript
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)
```
- `user`: Stan przechowujący dane zalogowanego użytkownika (np. { id, username, role }). Początkowo `null`.
- `loading`: Flaga wskazująca, czy sprawdzanie autentyfikacji trwa. Początkowo `true`, aby uniknąć renderowania przed sprawdzeniem.

#### Linie 11-27: useEffect - sprawdzenie autentyfikacji przy starcie
```javascript
useEffect(() => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')

  if (token && userData) {
    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      // Invalid user data, clear storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  setLoading(false)
}, [])
```
- Uruchamia się raz przy montowaniu komponentu (pusta tablica zależności `[]`).
- Pobiera `token` i `userData` z localStorage (trwałe przechowywanie sesji).
- Jeśli oba istnieją, parsuje `userData` jako JSON i ustawia `user`.
- Jeśli parsowanie się nie powiedzie (np. uszkodzone dane), czyści localStorage.
- Na koniec ustawia `loading` na `false`, co pozwala na renderowanie aplikacji.

#### Linie 29-34: Funkcja login
```javascript
const login = (token, userData) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(userData))
  setUser(userData)
}
```
- Przyjmuje `token` (string) i `userData` (obiekt).
- Zapisuje je w localStorage (token jako string, userData jako JSON).
- Aktualizuje stan `user`.

#### Linie 36-41: Funkcja logout
```javascript
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  setUser(null)
}
```
- Usuwa dane z localStorage.
- Resetuje `user` na `null`.

#### Linia 43: Obliczona wartość isAuthenticated
```javascript
const isAuthenticated = !!user
```
- Boolean: `true` jeśli `user` istnieje, `false` w przeciwnym razie.

#### Linie 45-53: Render Provider
```javascript
return (
  <AuthContext.Provider value={{
    user,
    loading,
    login,
    logout,
    isAuthenticated
  }}>
    {children}
  </AuthContext.Provider>
)
```
- Zawija `children` w `AuthContext.Provider`.
- Przekazuje obiekt z wartościami: `user`, `loading`, funkcje `login`/`logout`, `isAuthenticated`.

### Linie 55-62: Hook useAuth
```javascript
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```
- Hook do łatwego dostępu do kontekstu.
- Sprawdza, czy kontekst istnieje (czy komponent jest w drzewie AuthProvider).
- Jeśli nie, rzuca błąd – zapobiega używaniu poza Provider.
- Zwraca wartość kontekstu (obiekt z user, loading, itp.).

## Użycie w aplikacji
- Zawinąć główny komponent w `<AuthProvider>` (np. w `_app.js` Next.js).
- W komponentach: `const { user, login, logout } = useAuth()`.
- Przykład: W Header sprawdza `isAuthenticated` do wyświetlania przycisków logowania/wylogowania.

## Potencjalne problemy
- localStorage może być niedostępny (np. w SSR Next.js) – wymaga obsługi.
- Parsowanie JSON może się nie powieść – obsługiwane przez try/catch.
- Stan `loading` zapobiega warunkowemu renderowaniu przed sprawdzeniem.