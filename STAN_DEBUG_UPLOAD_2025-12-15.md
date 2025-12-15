# Stan debugowania uploadu (15.12.2025)

- Upload pliku przez Multer działa poprawnie na endpointach `/upload/test` (testowane przez Postmana).
- Błąd ReferenceError został naprawiony — endpoint znajduje się po inicjalizacji routera i uploadu.
- W `app.js` aktywne są tylko podstawowe middleware (np. express.json() dla /api) oraz router uploadu.
- Kolejne kroki: przywracać middleware/routery po jednym i testować upload po każdej zmianie.
- Jeśli upload przestanie działać po dodaniu middleware — szukać konfliktu w kolejności lub zakresie działania parserów.

## Pliki kluczowe:
- `routes/patches.js` — endpoint `/upload/test` po inicjalizacji routera i uploadu
- `app.js` — minimalna konfiguracja, gotowa do dalszego przywracania middleware

**Debug zakończony sukcesem na tym etapie!**
