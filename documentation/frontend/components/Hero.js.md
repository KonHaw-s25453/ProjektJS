# Dokumentacja: Hero.js

## Opis ogólny
Plik `Hero.js` to prosty komponent React wyświetlający sekcję powitalną (hero) na stronie głównej aplikacji. Zawiera tytuł i opis funkcji aplikacji VCV Rack Patches.

## Struktura pliku
- Komponent funkcyjny: Hero.
- JSX: Sekcja z kontenerem, h2 i p.

## Szczegółowe wyjaśnienia linii/fragmentów

### Linie 1-9: Komponent Hero
```javascript
export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <h2>Przechowuj i odkrywaj patche VCV Rack</h2>
        <p>Przeglądaj najnowsze patche, wyszukuj po modułach i autorach. Wgrywanie dostępne po zalogowaniu.</p>
      </div>
    </section>
  )
}
```
- Eksport domyślny komponentu funkcyjnego.
- Renderuje `<section>` z klasą "hero".
- Wewnątrz `<div className="container">` z tytułem h2 i opisem p.
- Tekst po polsku: Zachęca do przeglądania i uploadu patchy.

## Użycie
- Importowany i używany w stronach, np. w `pages/index.js`: `<Hero />`
- Wyświetla się na górze strony głównej.

## Potencjalne problemy
- Stylizacja: Wymaga CSS dla klas .hero i .container.
- Język: Tekst na stałe po polsku – jeśli internacjonalizacja, użyć i18n.</content>
<parameter name="filePath">c:\Users\konhaw\Desktop\Uczelnia\JS\ProjektJS\documentation\frontend\components\Hero.js.md