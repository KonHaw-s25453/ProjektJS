import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import { useAuth } from '../../components/AuthContext'

export default function PatchDetail() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  const [patch, setPatch] = useState(null)
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (!id) return

    fetch(`/patches/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.patch) setPatch(data.patch)
        if (data.notes) setNotes(data.notes)
        if (data.tags) setTags(data.tags)
      })
      .catch(err => console.error(err))
  }, [id])

  const addNote = async () => {
    const token = localStorage.getItem('token')
    if (!token) return alert('Zaloguj się')

    const res = await fetch(`/patches/${id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ note: newNote })
    })
    if (res.ok) {
      setNotes([...notes, { note: newNote, created_at: new Date() }])
      setNewNote('')
    }
  }

  const addTag = async () => {
    const token = localStorage.getItem('token')
    if (!token) return alert('Zaloguj się')

    const res = await fetch(`/patches/${id}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tag: newTag })
    })
    if (res.ok) {
      setTags([...tags, { tag: newTag }])
      setNewTag('')
    }
  }

  const deletePatch = async () => {
    const token = localStorage.getItem('token')
    if (!token) return alert('Zaloguj się')

    if (!confirm('Czy na pewno chcesz usunąć ten patch?')) return

    const res = await fetch(`/patches/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      alert('Patch usunięty')
      router.push('/')
    } else {
      alert('Błąd usuwania')
    }
  }

  const downloadPatch = async () => {
    const token = localStorage.getItem('token')
    if (!token) return alert('Zaloguj się')

    const res = await fetch(`/patches/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `patch_${id}.vcv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else {
      alert('Błąd pobierania')
    }
  }

  if (!patch) return <div>Loading...</div>

  return (
    <div>
      <Header />
      <main className="container">
        <h1>Patch #{patch.id} - {patch.description || 'Bez opisu'}</h1>
        <p>Użytkownik: {patch.user_name}</p>
        <p>Kategoria: {patch.category_name || 'Brak'}</p>
        <p>Liczba modułów: {patch.module_count}</p>
        <p>Producenci: {patch.producers || 'Brak'}</p>
        <p>Typy: {patch.types || 'Brak'}</p>
        <p>Tagi: {patch.tags || 'Brak'}</p>
        {patch.total_price > 0 && <p>Cena sumaryczna: ${patch.total_price}</p>}
        <p>Wgrano: {patch.uploaded_at}</p>

        <button onClick={downloadPatch} className="btn">Pobierz plik .vcv</button>
        {(user && (user.username === patch.user_name || user.role === 'admin' || user.role === 'owner')) && (
          <button onClick={deletePatch} className="btn btn-danger">Usuń patch</button>
        )}

        <h2>Notatki</h2>
        <ul>
          {notes.map((n, i) => <li key={i}>{n.note} ({n.created_at})</li>)}
        </ul>
        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Dodaj notatkę" />
        <button onClick={addNote} className="btn">Dodaj notatkę</button>

        <h2>Tagi</h2>
        <ul>
          {tags.map((t, i) => <li key={i}>{t.tag}</li>)}
        </ul>
        <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Dodaj tag" />
        <button onClick={addTag} className="btn">Dodaj tag</button>
      </main>
    </div>
  )
}