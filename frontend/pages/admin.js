import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])
  const [logs, setLogs] = useState([])
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Pobierz użytkowników
    fetch('/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(() => router.push('/'))

    // Pobierz logi
    fetch('/admin/logs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => {})
  }, [])

  const promoteToAdmin = async (userId) => {
    const token = localStorage.getItem('token')
    await fetch(`/admin/users/${userId}/promote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    // Odśwież listę
    window.location.reload()
  }

  const deleteUser = async (userId) => {
    const token = localStorage.getItem('token')
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return

    const res = await fetch(`/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      alert('Użytkownik usunięty')
      window.location.reload()
    } else {
      alert('Błąd usuwania')
    }
  }

  return (
    <div>
      <Header />
      <main className="container">
        <h1>Panel Administracyjny</h1>

        <h2>Administratorzy</h2>
        <ul>
          {admins.map(a => (
            <li key={a.id}>
              {a.username} ({a.display_name}) 
              <button onClick={() => demoteAdmin(a.id)} className="btn btn-danger">Usuń admina</button>
            </li>
          ))}
        </ul>

        <h2>Logi zmian</h2>
        <ul>
          {logs.map((log, i) => <li key={i}>{log}</li>)}
        </ul>
        <ul>
          {users.map(u => (
            <li key={u.id}>
              {u.username} ({u.display_name}) - Rola: {u.role}
              {u.role !== 'admin' && <button onClick={() => promoteToAdmin(u.id)} className="btn">Nadaj admina</button>}
              {u.role === 'admin' && <button onClick={() => demoteAdmin(u.id)} className="btn btn-warning">Odbierz admina</button>}
              {u.id !== user.id && u.role !== 'owner' && <button onClick={() => deleteUser(u.id)} className="btn btn-danger">Usuń użytkownika</button>}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}