'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/auth.store'
import { GET_ME } from '@/graphql/queries/dashboard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, setUser } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  const { data: meData } = useQuery(GET_ME, { skip: !token })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login')
    }
  }, [isHydrated, token, router])

  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me)
    }
  }, [meData, setUser])

  if (!isHydrated || !token) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
