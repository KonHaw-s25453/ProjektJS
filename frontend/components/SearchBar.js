import { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('')
  return (
    <div className="container searchbar">
      <label htmlFor="q" className="visually-hidden">Szukaj patchy</label>
      <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj po tytule, autorze, module..." />
      <button onClick={() => onSearch ? onSearch(q) : window.alert('Szukaj: ' + q)}>Szukaj</button>
    </div>
  )
}
