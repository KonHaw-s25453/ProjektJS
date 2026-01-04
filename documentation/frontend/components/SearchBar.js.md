# Dokumentacja: SearchBar.js

## Opis ogólny
Plik `SearchBar.js` to prosty komponent React paska wyszukiwania. Przyjmuje prop `onSearch` (callback), pozwala użytkownikowi wpisać zapytanie i wywołać wyszukiwanie.

## Struktura pliku
- Import: useState.
- Stan: q (query).
- JSX: Input i button.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-2: Import
```javascript
import { useState } from 'react'
```
- useState: Dla stanu zapytania.

### Linie 4-12: Komponent SearchBar
```javascript
export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('')
  return (
    <div className="container searchbar">
      <label htmlFor="q" className="visually-hidden">Szukaj patchy</label>
      <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj po tytule, autorze, module..." />
      <button onClick={() => onSearch ? onSearch(q) : console.log('Szukaj: ' + q)}>Szukaj</button>
    </div>
  )
}
```
- Prop onSearch: Funkcja callback do wykonania wyszukiwania.
- Stan q: Aktualizowany przy zmianie inputu.
- Input: Controlled component, placeholder po polsku.
- Button: Wywołuje onSearch(q) lub loguje jeśli brak onSearch.

## Użycie
- W komponentach listy: `<SearchBar onSearch={(query) => setSearchQuery(query)} />`
- onSearch powinien filtrować dane lub wysyłać zapytanie.

## Potencjalne problemy
- Brak onSearch: Tylko loguje – wymaga podania prop.
- Stylizacja: Wymaga CSS dla .searchbar.
- Dostępność: Label jest visually-hidden, ale input ma id.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\components\SearchBar.js.md