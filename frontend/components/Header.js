import { useAuth } from './AuthContext'

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="https://vcvrack.com/" className="logo">
          <img src="/pobrane.png" alt="VCV Rack" style={{ height: '40px' }} />
        </a>
        <nav>
          {isAuthenticated ? (
            <>
              <span className="user-info">Witaj, {user.username}!</span>
              <button onClick={logout} className="btn btn-ghost">Wyloguj</button>
            </>
          ) : (
            <>
              <a href="/login" className="btn">Zaloguj</a>
              <a href="/register" className="btn btn-ghost">Zarejestruj</a>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
