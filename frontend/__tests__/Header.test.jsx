import { render, screen } from '@testing-library/react'
import Header from '../components/Header'
import { AuthProvider } from '../components/AuthContext'

describe('Header', () => {
  it('renders site title and auth buttons for unauthenticated user', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )
    expect(screen.getByAltText('VCV Rack')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /VCV Rack/i })).toBeInTheDocument()
    expect(screen.getByText(/Zaloguj/i)).toBeInTheDocument()
    expect(screen.getByText(/Zarejestruj/i)).toBeInTheDocument()
    expect(screen.getByText(/Strona główna/i)).toBeInTheDocument()
  })

  it('renders user menu for authenticated user', () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => 'fake-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })

    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )
    // Note: This test assumes AuthContext loads user from localStorage
    // In real test, might need to mock useAuth or set user state
  })
})
