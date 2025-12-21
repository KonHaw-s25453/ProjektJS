export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <h1 className="logo">VCV Rack - Patch Storage</h1>
        <nav>
          <a href="/login" className="btn">Zaloguj</a>
          <a href="/register" className="btn btn-ghost">Zarejestruj</a>
        </nav>
      </div>
    </header>
  )
}
