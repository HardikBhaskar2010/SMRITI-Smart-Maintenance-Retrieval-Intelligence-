import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'

export function AppLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TopBar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Outlet />
      </main>
    </div>
  )
}
