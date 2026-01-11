import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import API_BASE_URL from '../lib/api'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Wybierz plik .vcv')
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('vcv', file)
    formData.append('category', category)
    formData.append('description', description)

    try {
      const token = localStorage.getItem('token')
      console.log('Token from localStorage:', token ? 'exists' : 'null')
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        mode: 'cors', // allow CORS
        credentials: 'include',
      })
      if (!res.ok) {
        const errorText = await res.text();
        console.log('Upload failed, status:', res.status, 'response:', errorText);
        throw new Error(`Upload failed: ${res.status} ${errorText}`);
      }
      const data = await res.json()
      alert('Patch uploaded successfully!')
      router.push('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header />
      <main style={{ padding: '20px' }}>
        <h1>Upload Patch</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label>File (.vcv):</label>
            <input type="file" accept=".vcv" onChange={(e) => setFile(e.target.files[0])} required />
          </div>
          <div>
            <label>Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category (optional)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Description:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button type="submit" disabled={loading}>Upload</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </main>
    </div>
  )
}