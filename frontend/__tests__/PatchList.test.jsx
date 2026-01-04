import { render, screen } from '@testing-library/react'
import PatchList from '../components/PatchList'

describe('PatchList', () => {
  it('shows empty message when no patches', () => {
    render(<PatchList patches={[]} />)
    expect(screen.getByText(/Brak patchy do wyświetlenia/i)).toBeInTheDocument()
  })

  it('renders patch cards when patches provided', () => {
    const patches = [
      { id: 1, user_name: 'user1', description: 'abc', uploaded_at: '2025-12-21', category_name: 'Ambient', module_count: 5, producers: 'VCV, Mutable', types: 'Scope, Braids', tags: 'ambient, test', total_price: 30.00 },
      { id: 2, user_name: 'user2', description: '', uploaded_at: '2025-12-20', category_name: null, module_count: 2, producers: null, types: null, tags: null, total_price: 0 }
    ]
    render(<PatchList patches={patches} />)
    expect(screen.getByText(/Patch #1/i)).toBeInTheDocument()
    expect(screen.getByText(/user1/i)).toBeInTheDocument()
    expect(screen.getByText(/Patch #2/i)).toBeInTheDocument()
    expect(screen.getByText('Ambient')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('VCV, Mutable')).toBeInTheDocument()
    expect(screen.getByText('Scope, Braids')).toBeInTheDocument()
    expect(screen.getByText('ambient, test')).toBeInTheDocument()
    expect(screen.getByText('$30')).toBeInTheDocument()
  })
})
