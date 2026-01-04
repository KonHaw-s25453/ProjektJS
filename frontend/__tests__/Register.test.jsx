import { render, screen } from '@testing-library/react'
import Register from '../pages/register'
import { AuthProvider } from '../components/AuthContext'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('Register page', () => {
  it('renders register placeholder', () => {
    render(
      <AuthProvider>
        <Register />
      </AuthProvider>
    )
    expect(screen.getByText(/Rejestracja/i)).toBeInTheDocument()
    expect(screen.getByText(/Nazwa użytkownika/i)).toBeInTheDocument()
  })

  // TODO: Add tests for actual form when implemented
})