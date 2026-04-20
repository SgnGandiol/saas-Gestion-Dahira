'use client'

import { useQuery } from '@apollo/client/react'
import { Users, Home, RotateCcw, DollarSign, TrendingUp, Calendar, TrendingDown, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'
import { GET_ME, GET_DASHBOARD_STATS } from '@/graphql/queries/dashboard'
import { formatDate } from '@/lib/utils'

interface DashboardStats {
  active_members_count: number
  houses_count: number
  monthly_contributions: number
  monthly_expenses: number
  balance: number
  next_rotation: {
    id: string
    scheduled_date: string
    status: string
    house: { id: string; label?: string; address: string }
  } | null
}

export default function DashboardPage() {
  const { user: storeUser } = useAuthStore()
  const dahiraId = storeUser?.dahira?.id

  const { data: meData } = useQuery(GET_ME)
  const { data: statsData, loading: statsLoading } = useQuery<{ dashboardStats: DashboardStats }>(
    GET_DASHBOARD_STATS,
    { variables: { dahira_id: dahiraId }, skip: !dahiraId }
  )

  const me    = meData?.me ?? storeUser
  const stats = statsData?.dashboardStats

  function formatAmount(n: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)
  }

  const kpis = [
    {
      label: 'Membres actifs',
      value: statsLoading ? '...' : String(stats?.active_members_count ?? '—'),
      icon:  Users,
      color: 'text-emerald-600',
      bg:    'bg-emerald-50',
    },
    {
      label: 'Maisons',
      value: statsLoading ? '...' : String(stats?.houses_count ?? '—'),
      icon:  Home,
      color: 'text-blue-600',
      bg:    'bg-blue-50',
    },
    {
      label: 'Cotisations (mois)',
      value: statsLoading ? '...' : (stats ? formatAmount(stats.monthly_contributions) : '—'),
      icon:  TrendingUp,
      color: 'text-amber-600',
      bg:    'bg-amber-50',
    },
    {
      label: 'Solde de caisse',
      value: statsLoading ? '...' : (stats ? formatAmount(stats.balance) : '—'),
      icon:  Wallet,
      color: stats?.balance != null && stats.balance < 0 ? 'text-red-600' : 'text-purple-600',
      bg:    stats?.balance != null && stats.balance < 0 ? 'bg-red-50' : 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Assalamu Alaikum, {me?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {me?.dahira?.name} · {me?.dahira?.city} · {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className={`mt-1 font-bold text-gray-900 ${value.length > 8 ? 'text-xl' : 'text-3xl'}`}>
                    {value}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section infos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prochain tour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Prochain tour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            ) : stats?.next_rotation ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {stats.next_rotation.house?.label || stats.next_rotation.house?.address}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.next_rotation.house?.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">
                    {formatDate(stats.next_rotation.scheduled_date)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    stats.next_rotation.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {stats.next_rotation.status === 'confirmed' ? 'Confirmé' : 'Planifié'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Aucun tour planifié. Utilisez le module <strong>Rotations</strong> pour en créer un.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Finance résumé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Finance du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Cotisations
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {formatAmount(stats.monthly_contributions)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    Dépenses
                  </div>
                  <span className="font-semibold text-red-600">
                    {formatAmount(stats.monthly_expenses)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Solde</span>
                  <span className={`font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatAmount(stats.balance)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Accédez au module <strong>Finance</strong> pour enregistrer des cotisations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
