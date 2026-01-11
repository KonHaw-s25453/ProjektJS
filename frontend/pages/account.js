import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import API_BASE_URL from '../lib/api'

export default function Account() {
  const [user, setUser] = useState(null)
  const [patches, setPatches] = useState([])
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Pobierz dane użytkownika
    fetch(`${API_BASE_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
        else router.push('/login')
      })
      .catch(() => router.push('/login'))

    // Pobierz patchy użytkownika
    fetch(`${API_BASE_URL}/patches?user=true`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPatches(data.patches || []))
  }, [])

  if (!user) return <div>Loading...</div>

  return (
    <div>
      <Header />
      <main className="container">
        <h1>Witaj, {user.display_name || user.username}!</h1>
        <p>Email: {user.email || 'Brak'}</p>
        <p>Rola: {user.role}</p>

        <h2>Twoje patchy</h2>
        <ul>
          {patches.map(p => (
            <li key={p.id}>
              <a href={`/patches/${p.id}`}>Patch #{p.id} - {p.description}</a>
            </li>
          ))}
        </ul>

        <a href="/upload">Dodaj nowy patch</a>
      </main>
    </div>
  )
}