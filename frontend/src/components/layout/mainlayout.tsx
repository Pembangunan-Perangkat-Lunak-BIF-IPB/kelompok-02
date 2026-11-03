import { Link, Outlet } from 'react-router'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-primary">
            Nama Aplikasi
          </Link>
          <div className="flex gap-6 text-sm">
            <Link to="/">Beranda</Link>
            <Link to="/parameters">Analisis</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        © 2026 Kelompok 02
      </footer>
    </div>
  )
}