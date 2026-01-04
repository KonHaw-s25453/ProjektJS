import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

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
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData,
        // Add auth header if needed
      })
      if (!res.ok) throw new Error('Upload failed')
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
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
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