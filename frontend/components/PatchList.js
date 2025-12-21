export default function PatchList({ patches = [] }) {
  if (!patches || patches.length === 0) return <p>Brak patchy do wyświetlenia.</p>
  return (
    <div className="container patch-list">
      {patches.map(p => (
        <article key={p.id} className="patch-card">
          <h3>Patch #{p.id} — {p.user_name}</h3>
          <p>{p.description || 'Brak opisu'}</p>
          <p className="meta">Wgrano: {p.uploaded_at || '—'}</p>
        </article>
      ))}
    </div>
  )
}
