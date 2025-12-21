import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../pages/login'

describe('Login page', () => {
  it('renders login placeholder', () => {
    render(<Login />)
    expect(screen.getByText(/Logowanie \(prototype\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Formularz logowania zostanie zaimplementowany później/i)).toBeInTheDocument()
  })

  // Testy dla przyszłej implementacji formularza
  it('renders login form with inputs and button', () => {
    // Zakładamy, że będzie formularz z username, password, submit
    render(<Login />)
    expect(screen.getByLabelText(/Nazwa użytkownika/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hasło/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zaloguj/i })).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'fake-token' }) }))
    render(<Login />)
    const usernameInput = screen.getByLabelText(/Nazwa użytkownika/i)
    const passwordInput = screen.getByLabelText(/Hasło/i)
    const submitButton = screen.getByRole('button', { name: /Zaloguj/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'testuser', password: 'password123' })
    })))
    // Zakładamy, że po sukcesie przekieruje lub pokaże komunikat
    expect(screen.getByText(/Zalogowano pomyślnie/i)).toBeInTheDocument()
  })

  it('handles login error', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Invalid credentials' }) }))
    render(<Login />)
    const usernameInput = screen.getByLabelText(/Nazwa użytkownika/i)
    const passwordInput = screen.getByLabelText(/Hasło/i)
    const submitButton = screen.getByRole('button', { name: /Zaloguj/i })

    fireEvent.change(usernameInput, { target: { value: 'wrong' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(submitButton)

    await waitFor(() => expect(screen.getByText(/Błąd logowania: Invalid credentials/i)).toBeInTheDocument())
  })
})