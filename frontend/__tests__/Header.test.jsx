import { render, screen } from '@testing-library/react'
import Header from '../components/Header'

describe('Header', () => {
  it('renders site title and auth buttons', () => {
    render(<Header />)
    expect(screen.getByAltText('VCV Rack')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /VCV Rack/i })).toBeInTheDocument()
    expect(screen.getByText(/Zaloguj/i)).toBeInTheDocument()
    expect(screen.getByText(/Zarejestruj/i)).toBeInTheDocument()
  })
})
