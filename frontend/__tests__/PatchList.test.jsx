import { render, screen } from '@testing-library/react'
import PatchList from '../components/PatchList'

describe('PatchList', () => {
  it('shows empty message when no patches', () => {
    render(<PatchList patches={[]} />)
    expect(screen.getByText(/Brak patchy do wyświetlenia/i)).toBeInTheDocument()
  })

  it('renders patch cards when patches provided', () => {
    const patches = [
      { id: 1, user_name: 'user1', description: 'abc', uploaded_at: '2025-12-21' },
      { id: 2, user_name: 'user2', description: '', uploaded_at: '2025-12-20' }
    ]
    render(<PatchList patches={patches} />)
    expect(screen.getByText(/Patch #1/i)).toBeInTheDocument()
    expect(screen.getByText(/user1/i)).toBeInTheDocument()
    expect(screen.getByText(/Patch #2/i)).toBeInTheDocument()
  })
})
