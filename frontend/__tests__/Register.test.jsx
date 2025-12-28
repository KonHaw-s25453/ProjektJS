import { render, screen } from '@testing-library/react'
import Register from '../pages/register'

describe('Register page', () => {
  it('renders register placeholder', () => {
    render(<Register />)
    expect(screen.getByText(/Rejestracja \(prototype\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Formularz rejestracji zostanie zaimplementowany później/i)).toBeInTheDocument()
  })

  // TODO: Add tests for actual form when implemented
})