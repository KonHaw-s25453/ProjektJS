import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from '../components/SearchBar'

describe('SearchBar', () => {
  it('renders input and button and calls onSearch', () => {
    const onSearch = jest.fn()
    render(<SearchBar onSearch={onSearch} />)
    const input = screen.getByPlaceholderText(/Szukaj po tytule, autorze, module/i)
    const button = screen.getByRole('button', { name: /Szukaj/i })

    fireEvent.change(input, { target: { value: 'osc' } })
    fireEvent.click(button)

    expect(onSearch).toHaveBeenCalledWith('osc')
  })

  it('handles empty search input', () => {
    const onSearch = jest.fn()
    render(<SearchBar onSearch={onSearch} />)
    const button = screen.getByRole('button', { name: /Szukaj/i })

    fireEvent.click(button)

    expect(onSearch).toHaveBeenCalledWith('')
  })
})
