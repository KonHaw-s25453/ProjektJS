import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { useAuth } from '../components/AuthContext'
import API_BASE_URL from '../lib/api'

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])
  const [logs, setLogs] = useState([])
  const [updateStatus, setUpdateStatus] = useState(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updatingPrices, setUpdatingPrices] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Pobierz użytkowników
    fetch(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(() => router.push('/'))

    // Pobierz logi
    fetch(`${API_BASE_URL}/admin/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => {})
  }, [])

  const promoteToAdmin = async (userId) => {
    const token = localStorage.getItem('token')
    await fetch(`${API_BASE_URL}/admin/users/${userId}/promote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    // Odśwież listę
    window.location.reload()
  }

  const deleteUser = async (userId) => {
    const token = localStorage.getItem('token')
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return

    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
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

  const checkForUpdates = async () => {
    setCheckingUpdates(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/check-updates`)
      const status = await res.json()
      setUpdateStatus(status)
    } catch (error) {
      alert('Błąd sprawdzania aktualizacji')
    } finally {
      setCheckingUpdates(false)
    }
  }

  const updatePrices = async () => {
    const token = localStorage.getItem('token')
    if (!token) return alert('Brak tokena')

    setUpdatingPrices(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/check-and-update`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Aktualizacja cen rozpoczęta - sprawdź ponownie za kilka minut')
        setUpdateStatus(null) // Clear status to force re-check
      } else {
        alert('Błąd aktualizacji cen')
      }
    } catch (error) {
      alert('Błąd aktualizacji cen')
    } finally {
      setUpdatingPrices(false)
    }
  }

  const demoteAdmin = async (userId) => {
    const token = localStorage.getItem('token')
    await fetch(`${API_BASE_URL}/admin/users/${userId}/demote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    window.location.reload()
  }

  return (
    <div>
      <Header />
      <main className="container">
        <h1>Panel Administracyjny</h1>

        <h2>Zarządzanie Cenami Modułów</h2>
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Status Aktualizacji Cen</h3>
          <button onClick={checkForUpdates} disabled={checkingUpdates} className="btn">
            {checkingUpdates ? 'Sprawdzanie...' : 'Sprawdź Aktualizacje'}
          </button>
          <button onClick={updatePrices} disabled={updatingPrices} className="btn btn-primary" style={{ marginLeft: '10px' }}>
            {updatingPrices ? 'Aktualizowanie...' : 'Aktualizuj Ceny'}
          </button>

          {updateStatus && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '3px' }}>
              <h4>Status:</h4>
              <p><strong>Lokalnie:</strong> {updateStatus.local.modules} modułów, {updateStatus.local.plugins} pluginów</p>
              <p><strong>Ostatnia aktualizacja:</strong> {updateStatus.local.lastUpdate ? new Date(updateStatus.local.lastUpdate).toLocaleString() : 'Nigdy'}</p>
              <p><strong>Biblioteka:</strong> {updateStatus.remote.modules || 'Nieznana'} modułów</p>
              <p><strong>Potrzebna aktualizacja:</strong> {updateStatus.needsUpdate ? 'Tak' : 'Nie'}</p>
              {updateStatus.reasons && updateStatus.reasons.length > 0 && (
                <div>
                  <strong>Powody:</strong>
                  <ul>
                    {updateStatus.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

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