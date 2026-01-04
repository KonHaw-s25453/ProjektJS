# Dokumentacja Projektu VCV Rack Patches

Ta dokumentacja szczegółowo wyjaśnia kod aplikacji, zarówno frontendu (React/Next.js) jak i backendu (Node.js/Express/MySQL). Każdy plik/plik kodu ma dedykowany plik .md z wyjaśnieniami linii po linii/fragmentów.

## Struktura Dokumentacji

### Frontend
- **components/**: Komponenty React.
  - `AuthContext.js.md`: Kontekst autentyfikacji, zarządzanie użytkownikiem, login/logout.
  - `Header.js.md`: Nagłówek z nawigacją warunkową na podstawie autentyfikacji.
  - `PatchList.js.md`: Lista patchy z kartkami zawierającymi szczegóły (kategoria, producenci, cena itp.).
  - `Hero.js.md`: Sekcja powitalna na stronie głównej.
  - `LoginForm.js.md`: Formularz logowania z walidacją i obsługą błędów.
  - `RegisterForm.js.md`: Formularz rejestracji z potwierdzeniem hasła.
  - `SearchBar.js.md`: Pasek wyszukiwania z callbackiem.

- **pages/**: Strony Next.js.
  - `index.js.md`: Strona główna z listą patchy, wyszukiwaniem i Hero.
  - `login.js.md`: Strona logowania z LoginForm.
  - `register.js.md`: Strona rejestracji z RegisterForm.
  - `account.js.md`: Strona konta użytkownika z danymi i listą patchy.
  - `admin.js.md`: Panel administracyjny z zarządzaniem użytkownikami.
  - `upload.js.md`: Strona uploadu patcha z formularzem.
  - `_app.js.md`: Główny plik Next.js z AuthProvider.
  - `patches/[id].js.md`: Szczegóły patcha z notatkami i tagami.

- **__tests__/**: Testy jednostkowe (dokumentacja w plikach .jsx z opisami testów).

### Backend
- **app.js.md**: Główny plik Express – konfiguracja serwera, middleware, routing, statystyki.

- **routes/**: Endpointy API.
  - `auth.js.md`: Rejestracja i logowanie użytkowników z bcrypt i JWT.
  - `api.js.md`: Dodatkowe endpointy API (np. /api/user).
  - `admin.js.md`: Endpointy administracyjne (użytkownicy, logi).
  - `patches.js.md`: Zarządzanie patchami (upload, lista, szczegóły, tagi).

- **models/**: Modele bazy danych.
  - `user.js.md`: Model dostępu do DB MySQL z pulą połączeń.

- **middleware/**: Middleware autentyfikacji.
  - `auth.js.md`: Sprawdzanie JWT, wymaganie logowania, role.

## Jak Czytać Dokumentację
Każdy plik .md zawiera:
- **Opis ogólny**: Cel pliku.
- **Struktura pliku**: Główne sekcje.
- **Szczegółowe wyjaśnienia linii/fragmentów**: Kod z komentarzami, co robi każda część.
- **Użycie**: Jak plik jest używany w aplikacji.
- **Potencjalne problemy**: Błędy, edge cases.

## Kluczowe Funkcjonalności Aplikacji
- **Autentyfikacja**: Rejestracja/logowanie z JWT, kontekst React.
- **Zarządzanie Patchami**: Upload, wyświetlanie listy, szczegóły z nowymi polami (ceny, producenci, tagi).
- **Panel Admin**: Zarządzanie użytkownikami, logami.
- **Baza Danych**: MySQL z tabelami users, patches itp.

## Uruchamianie Aplikacji
- Backend: `node server.js` (port 3000).
- Frontend: `npm run dev` w katalogu frontend (port 3000).
- Testy: `npm test` w frontend.

Ta dokumentacja jest kompletna dla głównych plików; dodatkowe pliki będą dodane w miarę potrzeb.