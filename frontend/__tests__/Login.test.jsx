import { render, screen } from '@testing-library/react'
import Login from '../pages/login'

describe('Login page', () => {
  it('renders login placeholder', () => {
    render(<Login />)
    expect(screen.getByText(/Logowanie \(prototype\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Formularz logowania zostanie zaimplementowany później/i)).toBeInTheDocument()
  })

  // TODO: Add tests for actual form when implemented
})