import { render, screen } from '@testing-library/react'
import Login from '../pages/login'
import { AuthProvider } from '../components/AuthContext'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Login page', () => {
  it('renders login placeholder', () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    )
    expect(screen.getByText(/Logowanie/i)).toBeInTheDocument()
    expect(screen.getByText(/Nazwa użytkownika/i)).toBeInTheDocument()
  })

  // TODO: Add tests for actual form when implemented
})