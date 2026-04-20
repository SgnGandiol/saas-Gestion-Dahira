'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Home,
  RotateCcw,
  DollarSign,
  ClipboardList,
  Settings,
  LogOut,
  LayoutDashboard,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { apolloClient } from '@/lib/apollo'
import { useMutation } from '@apollo/client/react'
import { LOGOUT_MUTATION } from '@/graphql/mutations/auth'

const navItems = [
  { href: '/dashboard',             label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/members',     label: 'Membres',         icon: Users },
  { href: '/dashboard/maisons',      label: 'Maisons',         icon: Home },
  { href: '/dashboard/rotations',   label: 'Tours',           icon: RotateCcw },
  { href: '/dashboard/finance',     label: 'Finance',         icon: DollarSign },
  { href: '/dashboard/assignments', label: 'Tâches',          icon: ClipboardList },
  { href: '/dashboard/settings',    label: 'Paramètres',      icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, clearAuth, isSuperAdmin } = useAuthStore()
  const [logoutMutation] = useMutation(LOGOUT_MUTATION)

  const handleLogout = async () => {
    try {
      await logoutMutation()
    } catch {
      // Session déjà expirée côté serveur, on continue
    }
    clearAuth()
    await apolloClient.clearStore()
    window.location.href = '/login'
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
          <span className="text-white font-bold text-sm">SGD</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">
            {user?.dahira?.name ?? 'Mon Dahira'}
          </p>
          <p className="text-xs text-gray-500">{user?.dahira?.city ?? ''}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {isSuperAdmin() && (
          <Link
            href="/dashboard/dahiras"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname.startsWith('/dashboard/dahiras')
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Building2 className={cn('h-4 w-4', pathname.startsWith('/dashboard/dahiras') ? 'text-emerald-600' : 'text-gray-400')} />
            Dahiras
          </Link>
        )}
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-emerald-600' : 'text-gray-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-emerald-700 text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.roles?.[0]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
