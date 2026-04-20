import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict${secure}`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
}

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  dahira?: {
    id: string
    name: string
    city?: string
    slug?: string
    country?: string
    phone?: string
    email?: string
    is_active?: boolean
  }
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
  isSuperAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setUser: (user) => {
        if (user.dahira?.id) {
          localStorage.setItem('sgd_tenant_id', user.dahira.id)
          setCookie('sgd_tenant_id', user.dahira.id)
        }
        set({ user })
      },

      setAuth: (token, user) => {
        localStorage.setItem('sgd_token', token)
        setCookie('sgd_token', token)
        if (user.dahira?.id) {
          localStorage.setItem('sgd_tenant_id', user.dahira.id)
          setCookie('sgd_tenant_id', user.dahira.id)
        } else {
          localStorage.removeItem('sgd_tenant_id')
          deleteCookie('sgd_tenant_id')
        }
        set({ token, user })
      },

      clearAuth: () => {
        localStorage.removeItem('sgd_token')
        localStorage.removeItem('sgd_tenant_id')
        deleteCookie('sgd_token')
        deleteCookie('sgd_tenant_id')
        set({ token: null, user: null })
      },

      isAuthenticated: () => !!get().token,

      isSuperAdmin: () => get().user?.roles?.includes('super_admin') ?? false,
    }),
    {
      name: 'sgd-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
