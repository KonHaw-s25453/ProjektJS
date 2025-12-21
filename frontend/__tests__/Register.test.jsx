import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Register from '../pages/register'

describe('Register page', () => {
  it('renders register placeholder', () => {
    render(<Register />)
    expect(screen.getByText(/Rejestracja \(prototype\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Formularz rejestracji zostanie zaimplementowany później/i)).toBeInTheDocument()
  })

  // Testy dla przyszłej implementacji formularza
  it('renders register form with inputs and button', () => {
    render(<Register />)
    expect(screen.getByLabelText(/Nazwa użytkownika/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hasło/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Potwierdź hasło/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zarejestruj/i })).toBeInTheDocument()
  })

  it('handles successful registration', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { id: 1, username: 'newuser' } }) }))
    render(<Register />)
    const usernameInput = screen.getByLabelText(/Nazwa użytkownika/i)
    const passwordInput = screen.getByLabelText(/Hasło/i)
    const confirmInput = screen.getByLabelText(/Potwierdź hasło/i)
    const submitButton = screen.getByRole('button', { name: /Zarejestruj/i })

    fireEvent.change(usernameInput, { target: { value: 'newuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'newuser', password: 'password123' })
    })))
    expect(screen.getByText(/Rejestracja pomyślna/i)).toBeInTheDocument()
  })

  it('handles registration error', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Username already exists' }) }))
    render(<Register />)
    const usernameInput = screen.getByLabelText(/Nazwa użytkownika/i)
    const passwordInput = screen.getByLabelText(/Hasło/i)
    const confirmInput = screen.getByLabelText(/Potwierdź hasło/i)
    const submitButton = screen.getByRole('button', { name: /Zarejestruj/i })

    fireEvent.change(usernameInput, { target: { value: 'existing' } })
    fireEvent.change(passwordInput, { target: { value: 'pass' } })
    fireEvent.change(confirmInput, { target: { value: 'pass' } })
    fireEvent.click(submitButton)

    await waitFor(() => expect(screen.getByText(/Błąd rejestracji: Username already exists/i)).toBeInTheDocument())
  })

  it('validates password confirmation mismatch', () => {
    render(<Register />)
    const passwordInput = screen.getByLabelText(/Hasło/i)
    const confirmInput = screen.getByLabelText(/Potwierdź hasło/i)
    const submitButton = screen.getByRole('button', { name: /Zarejestruj/i })

    fireEvent.change(passwordInput, { target: { value: 'pass1' } })
    fireEvent.change(confirmInput, { target: { value: 'pass2' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/Hasła nie są identyczne/i)).toBeInTheDocument()
  })
})