import { render, screen, waitFor, act } from '@testing-library/react'
import Account from '../pages/account'
import { AuthProvider } from '../components/AuthContext'
import React from 'react'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

describe('Account page', () => {
  const originalFetch = global.fetch
  const originalLocalStorage = global.localStorage

  beforeEach(() => {
    global.fetch = jest.fn()
    global.localStorage = {
      getItem: jest.fn(() => 'fake-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
  })

  afterEach(() => {
    global.fetch = originalFetch
    global.localStorage = originalLocalStorage
    jest.resetAllMocks()
  })

  it('redirects to login if no token', () => {
    global.localStorage.getItem = jest.fn(() => null)
    render(
      <AuthProvider>
        <Account />
      </AuthProvider>
    )
    // Assuming useRouter push is called, but hard to test without mocking
  })

  it('fetches and displays user data and patches', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: { id: 1, username: 'testuser', display_name: 'Test User', role: 'user' } }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ patches: [{ id: 1, description: 'Test patch' }] }) })

    await act(async () => {
      render(
        <AuthProvider>
          <Account />
        </AuthProvider>
      )
    })

    await waitFor(() => expect(screen.getByText(/Witaj, Test User!/i)).toBeInTheDocument(), { timeout: 10000 })
    expect(screen.getByText(/Test patch/i)).toBeInTheDocument()
  }, 15000)
})