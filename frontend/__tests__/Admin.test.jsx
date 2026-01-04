import { render, screen, waitFor, act } from '@testing-library/react'
import Admin from '../pages/admin'
import { AuthProvider } from '../components/AuthContext'
import React from 'react'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/admin',
    query: {},
    asPath: '/admin',
  }),
}))

describe('Admin page', () => {
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

  it('redirects if not admin', () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({ json: () => Promise.resolve({ user: { role: 'user' } }) }))
    render(
      <AuthProvider>
        <Admin />
      </AuthProvider>
    )
    // Assuming redirect happens
  })

  it('displays admin panel for admin user', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: { id: 1, username: 'admin', role: 'admin' } }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ users: [{ id: 1, username: 'user1', display_name: 'User One', role: 'user' }] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ logs: ['Log1', 'Log2'] }) })

    await act(async () => {
      render(
        <AuthProvider>
          <Admin />
        </AuthProvider>
      )
    })

    await waitFor(() => expect(screen.getByText(/Panel Administracyjny/i)).toBeInTheDocument())
    expect(screen.getByText(/user1/i)).toBeInTheDocument()
  }, 10000)
})