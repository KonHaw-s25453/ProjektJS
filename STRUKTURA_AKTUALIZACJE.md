# Porównanie diagramu nawigacji z aktualną strukturą projektu

## 1. Strona główna
- **Diagram:** Centralny punkt nawigacji.
- **Backend:** Brak dedykowanego endpointu, można dodać prosty `GET /` (np. info o API lub statystyki).

## 2. Wyszukiwanie
- **Diagram:** Osobna sekcja, wyniki prowadzą do patchy/użytkowników.
- **Backend:** Endpoint `GET /patches` już istnieje (filtrowanie po user, category, since). Brakuje wyszukiwania po tagu, nazwie, autorze.

## 3. Logowanie / Tworzenie konta
- **Diagram:** `/login`, `/register`.
- **Backend:** Endpointy `POST /auth/login`, `POST /register` są zaimplementowane.

## 4. Strona konta
- **Diagram:** `/account`.
- **Backend:** Brak dedykowanego endpointu `GET /users/:id` (dane użytkownika). Można dodać.

## 5. Strony patchy
- **Diagram:** `/patches/:id`, operacje na patchach.
- **Backend:**
  - `POST /upload` (upload patcha) – jest.
  - `GET /patches/:id` – brak, do dodania.
  - `POST /patches/:id/notes` – szablon jest, wymaga implementacji.
  - `POST /patches/:id/tags` – szablon jest, wymaga implementacji.
  - `GET /patches/:id/download` – szablon jest.
  - `DELETE /patches/:id` – brak, do dodania.

## 6. Panel administracyjny
- **Diagram:** `/admin`, zarządzanie użytkownikami, logi.
- **Backend:** Brak routera/admina, endpointów do zarządzania użytkownikami, logów, ról. Do dodania.

## 7. Zarządzanie użytkownikami/adminami
- **Diagram:** `/admin/users`, `/admin/admins`.
- **Backend:** Brak, do dodania.

## 8. Uprawnienia
- **Diagram:** Middleware, kontrola ról.
- **Backend:** Middleware JWT i ról jest, ale nie wszędzie użyty (np. przy notatkach/tagach, adminie).

---

# Lista zmian wymaganych do pełnej zgodności z diagramem

1. **Dodaj endpoint `GET /`** – strona główna (np. info o API, statystyki).
2. **Rozszerz `GET /patches` o wyszukiwanie po tagu, nazwie, autorze.**
3. **Dodaj endpoint `GET /patches/:id`** – szczegóły patcha.
4. **Zaimplementuj logikę w `POST /patches/:id/notes` i `POST /patches/:id/tags`.**
5. **Dodaj endpoint `DELETE /patches/:id`** – usuwanie patcha (właściciel/admin).
6. **Dodaj endpoint `GET /users/:id`** – pobieranie danych użytkownika.
7. **Dodaj router i endpointy admina:**
   - `GET /admin/users` – lista użytkowników
   - `POST /admin/users/:id/role` – zmiana roli
   - `DELETE /users/:id` – usuwanie użytkownika
   - `GET /admin/logs` – logi zmian
8. **Dodaj/wykorzystaj middleware ról przy wszystkich endpointach wymagających uprawnień.**

---

**Podsumowanie:**
Projekt jest zgodny z diagramem w zakresie podstawowych funkcji (rejestracja, logowanie, upload, lista patchy), ale wymaga rozszerzenia o szczegóły patchy, zarządzanie użytkownikami/adminami, logi oraz pełne wykorzystanie uprawnień.
