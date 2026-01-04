import { render, screen, waitFor } from '@testing-library/react'
import PatchDetail from '../pages/patches/[id]'
import { AuthProvider } from '../components/AuthContext'
import React from 'react'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: '1' },
  }),
}))

describe('PatchDetail page', () => {
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

  it('fetches and displays patch details', async () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({
      json: () => Promise.resolve({
        patch: {
          id: 1,
          description: 'Test patch',
          user_name: 'testuser',
          uploaded_at: '2023-01-01',
          category_name: 'Test category',
          module_count: 5,
          producers: ['Producer1'],
          types: ['Type1'],
          tags: ['Tag1'],
          total_price: 100,
          is_free: false,
          modules: [{ id: 1, name: 'Module1' }]
        },
        notes: [],
        tags: []
      })
    }))

    render(
      <AuthProvider>
        <PatchDetail />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByText(/Test patch/i)).toBeInTheDocument())
    expect(screen.getByText(/Test category/i)).toBeInTheDocument()
    expect(screen.getByText(/5/i)).toBeInTheDocument()
    expect(screen.getByText(/Producer1/i)).toBeInTheDocument()
    expect(screen.getByText(/Type1/i)).toBeInTheDocument()
    expect(screen.getByText(/Tag1/i)).toBeInTheDocument()
    expect(screen.getByText(/100/i)).toBeInTheDocument()
  })
})