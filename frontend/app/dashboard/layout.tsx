'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { GET_ME } from '@/graphql/queries/dashboard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, user, setUser } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: meData } = useQuery(GET_ME, { skip: !token })

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (isHydrated && !token) router.replace('/login')
  }, [isHydrated, token, router])

  useEffect(() => {
    if (meData?.me) setUser(meData.me)
  }, [meData, setUser])

  if (!isHydrated || !token) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar desktop */}
      <div className="hidden md:flex h-screen shrink-0">
        <Sidebar />
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar mobile (slide depuis la gauche) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex md:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header mobile uniquement */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 shrink-0">
              <span className="text-white font-bold text-xs">SGD</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 truncate">
              {user?.dahira?.name ?? 'Mon Dahira'}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
