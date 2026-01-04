# Dokumentacja: PatchList.js

## Opis ogólny
Plik `PatchList.js` definiuje komponent do wyświetlania listy patchy (patchów). Renderuje kartki dla każdego patcha z informacjami jak kategoria, producenci, cena itp. Obsługuje pustą listę.

## Struktura pliku
- Komponent funkcyjny `PatchList` z props `patches`.
- Warunkowe renderowanie: pusta lista lub lista kart.

## Szczegółowe wyjaśnienia linii

### Linia 1: Deklaracja komponentu
```javascript
export default function PatchList({ patches = [] }) {
```
- Eksport domyślny komponentu funkcyjnego.
- Przyjmuje props `patches`: tablica obiektów patch (domyślnie pusta tablica `[]`).

### Linie 2-3: Sprawdzanie pustej listy
```javascript
if (!patches || patches.length === 0) return <p>Brak patchy do wyświetlenia.</p>
```
- Jeśli `patches` jest falsy (null/undefined) lub pusta, zwraca paragraf z komunikatem.
- Zapobiega renderowaniu pustej listy.

### Linie 4-22: Render listy
```javascript
return (
  <div className="container patch-list">
    {patches.map(p => (
      <article key={p.id} className="patch-card">
        <h3><a href={`/patches/${p.id}`}>Patch #{p.id} — {p.user_name}</a></h3>
        <p>{p.description || 'Brak opisu'}</p>
        <p><strong>Kategoria:</strong> {p.category_name || 'Brak'}</p>
        <p><strong>Liczba modułów:</strong> {p.module_count}</p>
        <p><strong>Producenci:</strong> {p.producers || 'Brak'}</p>
        <p><strong>Typy:</strong> {p.types || 'Brak'}</p>
        <p><strong>Tagi:</strong> {p.tags || 'Brak'}</p>
        {p.total_price > 0 && <p><strong>Cena sumaryczna:</strong> ${p.total_price}</p>}
        <p className="meta">Wgrano: {p.uploaded_at || '—'}</p>
      </article>
    ))}
  </div>
)
```
- `<div className="container patch-list">`: Kontener z klasami CSS dla listy.
- `{patches.map(p => (`: Iteruje po tablicy `patches`, każdy element `p` to obiekt patch.
  - `<article key={p.id} className="patch-card">`: Element artykułu dla każdej karty patch, klucz `p.id` dla React.
    - `<h3><a href={`/patches/${p.id}`}>Patch #{p.id} — {p.user_name}</a></h3>`: Nagłówek z linkiem do szczegółów patcha, ID i nazwa użytkownika.
    - `<p>{p.description || 'Brak opisu'}</p>`: Opis patcha lub fallback.
    - `<p><strong>Kategoria:</strong> {p.category_name || 'Brak'}</p>`: Kategoria z pogrubieniem.
    - `<p><strong>Liczba modułów:</strong> {p.module_count}</p>`: Liczba modułów.
    - `<p><strong>Producenci:</strong> {p.producers || 'Brak'}</p>`: Lista producentów lub 'Brak'.
    - `<p><strong>Typy:</strong> {p.types || 'Brak'}</p>`: Typy modułów.
    - `<p><strong>Tagi:</strong> {p.tags || 'Brak'}</p>`: Tagi.
    - `{p.total_price > 0 && <p><strong>Cena sumaryczna:</strong> ${p.total_price}</p>}`: Cena tylko jeśli > 0.
    - `<p className="meta">Wgrano: {p.uploaded_at || '—'}</p>`: Data uploadu z klasą meta.

## Użycie w aplikacji
- Import: `import PatchList from '../components/PatchList'`.
- Przykład: `<PatchList patches={patchesFromAPI} />` na stronie głównej lub wynikach wyszukiwania.

## Potencjalne problemy
- Jeśli `p.id` nie jest unikalny, React ostrzeże o kluczach.
- Pola jak `p.producers` mogą być string/array – kod zakłada string.
- CSS klasy muszą być zdefiniowane dla stylizacji kart.