import { render, screen } from '@testing-library/react'
import Hero from '../components/Hero'

describe('Hero', () => {
  it('renders heading and description', () => {
    render(<Hero />)
    expect(screen.getByText(/Przechowuj i odkrywaj patche VCV Rack/i)).toBeInTheDocument()
    expect(screen.getByText(/Wgrywanie dostępne po zalogowaniu/i)).toBeInTheDocument()
  })
})
