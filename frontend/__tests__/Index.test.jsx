import { render, screen, waitFor } from '@testing-library/react'
import Home from '../pages/index'
import React from 'react'

describe('Index page', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ patches: [ { id: 10, user_name: 'demo', description: 'x', uploaded_at: '2025-12-21' } ] }) }))
  })
  afterEach(() => {
    global.fetch = originalFetch
    jest.resetAllMocks()
  })

  it('fetches patches and displays them', async () => {
    render(<Home />)
    await waitFor(() => expect(screen.getByText(/Patch #10/i)).toBeInTheDocument())
    expect(screen.getByText(/demo/i)).toBeInTheDocument()
  })

  it('handles fetch error and shows fallback data', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))
    render(<Home />)
    await waitFor(() => expect(screen.getByText(/Błąd: Network error/i)).toBeInTheDocument())
    expect(screen.getByText(/Patch #1/i)).toBeInTheDocument() // fallback data
    expect(screen.getByText(/anon/i)).toBeInTheDocument()
  })

  // Testy dla przyszłej implementacji wyszukiwania
  it('filters patches based on search query', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ patches: [
      { id: 1, user_name: 'user1', description: 'oscillator patch', uploaded_at: '2025-12-21' },
      { id: 2, user_name: 'user2', description: 'drum patch', uploaded_at: '2025-12-20' }
    ] }) }))
    render(<Home />)
    await waitFor(() => expect(screen.getByText(/Patch #1/i)).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText(/Szukaj po tytule, autorze, module/i)
    const searchButton = screen.getByRole('button', { name: /Szukaj/i })

    fireEvent.change(searchInput, { target: { value: 'osc' } })
    fireEvent.click(searchButton)

    // Zakładamy, że fetch zostanie wywołany ponownie z query
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/patches?query=osc'))
    expect(screen.getByText(/oscillator patch/i)).toBeInTheDocument()
    expect(screen.queryByText(/drum patch/i)).not.toBeInTheDocument()
  })

  it('handles empty search query', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ patches: [
      { id: 1, user_name: 'user1', description: 'patch1', uploaded_at: '2025-12-21' }
    ] }) }))
    render(<Home />)
    await waitFor(() => expect(screen.getByText(/Patch #1/i)).toBeInTheDocument())

    const searchButton = screen.getByRole('button', { name: /Szukaj/i })
    fireEvent.click(searchButton)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/patches'))
  })
})
