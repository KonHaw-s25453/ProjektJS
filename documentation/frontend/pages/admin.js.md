# Dokumentacja: pages/admin.js

## Opis ogólny
Plik `admin.js` to strona panelu administracyjnego w Next.js. Dostępna tylko dla adminów, wyświetla użytkowników, logi, pozwala na promowanie/demote/usuwanie użytkowników.

## Struktura pliku
- Importy: useEffect, useState, useRouter, Header.
- Stan: users, admins, logs.
- useEffect: Pobiera dane.
- Funkcje: promoteToAdmin, deleteUser, demoteAdmin.
- JSX: Header, main z listami i przyciskami.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-4: Importy
Podobne do innych stron.

### Linie 6-9: Stan
```javascript
const [users, setUsers] = useState([])
const [admins, setAdmins] = useState([])
const [logs, setLogs] = useState([])
const router = useRouter()
```
- users: Lista użytkowników.
- admins: Lista adminów (ale nie używana w kodzie?).
- logs: Lista logów.

### Linie 11-30: useEffect
Pobiera /admin/users i /admin/logs, sprawdza token.

### Linie 32-40: promoteToAdmin
```javascript
const promoteToAdmin = async (userId) => {
  const token = localStorage.getItem('token')
  await fetch(`/admin/users/${userId}/promote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  // Odśwież listę
  window.location.reload()
}
```
- Wysyła POST do promote, odświeża stronę.

### Linie 42-55: deleteUser
Usuwa użytkownika z potwierdzeniem, alert.

### Linie 57-94: JSX
Wyświetla listę adminów, logi, użytkowników z przyciskami akcji.

## Użycie
- Ścieżka: /admin
- Tylko dla adminów (backend sprawdza).

## Potencjalne problemy
- Uprawnienia: Jeśli nie admin, backend zwraca błąd.
- Reload: window.location.reload() – nie optymalne, lepiej refetch.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\pages\admin.js.md