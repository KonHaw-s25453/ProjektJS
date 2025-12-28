import { useState } from 'react'
import { useRouter } from 'next/router'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear errors when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('Wszystkie pola są wymagane')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }

    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Błąd rejestracji')
      }

      setSuccess('Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.')
      setFormData({ username: '', password: '', confirmPassword: '' })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <div className="form-card">
        <h2>Rejestracja</h2>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nazwa użytkownika</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Wprowadź nazwę użytkownika"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Wprowadź hasło"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Potwierdź hasło</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Potwierdź hasło"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
          </button>
        </form>

        <div className="auth-links">
          <p>Masz już konto? <a href="/login">Zaloguj się</a></p>
        </div>
      </div>
    </div>
  )
}