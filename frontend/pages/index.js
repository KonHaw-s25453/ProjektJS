import Head from 'next/head'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SearchBar from '../components/SearchBar'
import PatchList from '../components/PatchList'
import API_BASE_URL from '../lib/api'

export default function Home() {
  const [patches, setPatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onSearch = async (query) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/patches?query=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search error')
      const data = await res.json()
      setPatches(data.patches || data || [])
    } catch (e) {
      setError(e.message)
      // Keep current patches or fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/patches`)
        if (!res.ok) throw new Error('Network error')
        const data = await res.json()
        setPatches(data.patches || data || [])
      } catch (e) {
        // fallback: simple mock data so prototype works without backend
        setError(e.message)
        setPatches([
          { id: 1, user_name: 'anon', description: 'Przykładowy patch', uploaded_at: '2025-12-21', file_path: '', category_id: null },
          { id: 2, user_name: 'demo', description: 'Inny patch', uploaded_at: '2025-12-20', file_path: '', category_id: null }
        ])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <Head>
        <title>VCV Patch Storage - Landing</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main className="container">
        <Hero />
        <SearchBar onSearch={onSearch} />
        <section aria-live="polite">
          {loading && <p>Ładowanie...</p>}
          {error && <p className="error">Błąd: {error} — pokazuję przykładowe dane.</p>}
          <PatchList patches={patches} />
        </section>
      </main>
    </div>
  )
}
