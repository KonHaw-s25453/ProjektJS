import { render, screen } from '@testing-library/react'
import Header from '../components/Header'

describe('Header', () => {
  it('renders site title and auth buttons', () => {
    render(<Header />)
    expect(screen.getByText(/VCV Rack - Patch Storage/i)).toBeInTheDocument()
    expect(screen.getByText(/Zaloguj/i)).toBeInTheDocument()
    expect(screen.getByText(/Zarejestruj/i)).toBeInTheDocument()
  })
})
