import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-dark-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative flex-1 overflow-auto grid-pattern">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent" />
          <div className="relative h-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
