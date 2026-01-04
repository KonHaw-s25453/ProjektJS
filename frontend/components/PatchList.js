export default function PatchList({ patches = [] }) {
  if (!patches || patches.length === 0) return <p>Brak patchy do wyświetlenia.</p>
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
}
