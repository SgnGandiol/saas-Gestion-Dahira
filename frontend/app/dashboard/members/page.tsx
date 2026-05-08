'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { Users, Plus, Search, Edit2, Trash2, Home, Phone, X, UserCheck, UserX, Eye } from 'lucide-react'
import { useState, useMemo } from 'react'
import { MemberModal } from '@/components/members/MemberModal'
import { MemberDetailDrawer } from '@/components/members/MemberDetailDrawer'
import { useAuthStore } from '@/store/auth.store'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { DELETE_MEMBER } from '@/graphql/mutations/members'
import { Member, MemberAvailabilityStatus } from '@/types'

const BACKEND = (process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:8081/graphql').replace('/graphql', '')

const AVAILABILITY_CONFIG: Record<MemberAvailabilityStatus, { label: string; dot: string; bg: string }> = {
  available:   { label: 'Disponible',   dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700'  },
  unavailable: { label: 'Indisponible', dot: 'bg-red-500',     bg: 'bg-red-50 text-red-600'          },
  travel:      { label: 'Voyage',       dot: 'bg-amber-500',   bg: 'bg-amber-50 text-amber-700'      },
  sick:        { label: 'Malade',       dot: 'bg-orange-500',  bg: 'bg-orange-50 text-orange-700'    },
  suspended:   { label: 'Suspendu',     dot: 'bg-gray-400',    bg: 'bg-gray-100 text-gray-500'       },
}

const AVATAR_COLORS = [
  'bg-emerald-500','bg-blue-500','bg-violet-500','bg-amber-500',
  'bg-rose-500','bg-teal-500','bg-indigo-500','bg-orange-500',
]

type FilterStatus = 'all' | 'active' | 'inactive'

export default function MembersPage() {
  const { user } = useAuthStore()
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState<FilterStatus>('all')
  const [isModalOpen, setIsModalOpen]     = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined)
  const [detailMember, setDetailMember]   = useState<Member | null>(null)

  const { data, loading, refetch } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: user?.dahira?.id, first: 100, page: 1 },
    skip: !user?.dahira?.id,
  })

  const [deleteMember, { loading: deleteLoading }] = useMutation(DELETE_MEMBER, {
    onCompleted: () => refetch(),
    onError: (err: any) => alert('Erreur: ' + (err?.graphQLErrors?.[0]?.message ?? err.message)),
  })

  const members: any[] = data?.members?.data ?? []
  const total = data?.members?.paginatorInfo?.total ?? 0

  const stats = useMemo(() => ({
    total,
    active:    members.filter(m => m.is_active).length,
    withHouse: members.filter(m => m.house).length,
    noHouse:   members.filter(m => !m.house).length,
  }), [members, total])

  const filtered = useMemo(() => members.filter(m => {
    const matchSearch =
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search) ||
      m.house?.address?.toLowerCase().includes(search.toLowerCase()) ||
      m.house?.label?.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === 'all'    ? true :
      filterStatus === 'active' ? m.is_active : !m.is_active
    return matchSearch && matchStatus
  }).sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr', { sensitivity: 'base' })), [members, search, filterStatus])

  const handleOpenModal = (member?: Member) => {
    setSelectedMember(member)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedMember(undefined)
  }

  const handleDelete = (m: any) => {
    if (confirm(`Supprimer ${m.full_name} ? Cette action est irréversible.`)) {
      deleteMember({ variables: { id: m.id } })
    }
  }

  return (
    <div className="space-y-6">
      <MemberDetailDrawer
        member={detailMember}
        onClose={() => setDetailMember(null)}
        onEdit={(m) => handleOpenModal(m)}
      />

      <MemberModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => refetch()}
        dahiraId={user?.dahira?.id || ''}
        member={selectedMember}
      />

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} membres enregistrés</p>
        </div>
        <button onClick={() => handleOpenModal()}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un membre</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* ── Stats chips ── */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: stats.total,    icon: Users,     color: 'text-gray-700',    bg: 'bg-gray-100'    },
            { label: 'Actifs',      value: stats.active,   icon: UserCheck, color: 'text-emerald-700', bg: 'bg-emerald-100' },
            { label: 'Avec maison', value: stats.withHouse,icon: Home,      color: 'text-blue-700',    bg: 'bg-blue-100'    },
            { label: 'Sans maison', value: stats.noHouse,  icon: UserX,     color: 'text-amber-700',   bg: 'bg-amber-100'   },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Rechercher par nom, téléphone, adresse..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-8 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors bg-white" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-gray-100 p-1 shrink-0">
          {([
            { id: 'all',      label: 'Tous'     },
            { id: 'active',   label: 'Actifs'   },
            { id: 'inactive', label: 'Inactifs' },
          ] as { id: FilterStatus; label: string }[]).map(f => (
            <button key={f.id} onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === f.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {search || filterStatus !== 'all' ? 'Aucun membre trouvé' : 'Aucun membre enregistré'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search
              ? `Aucun résultat pour « ${search} »`
              : filterStatus !== 'all' ? 'Essayez un autre filtre'
              : 'Commencez par ajouter votre premier membre'}
          </p>
          {!search && filterStatus === 'all' && (
            <button onClick={() => handleOpenModal()}
              className="mt-4 flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" /> Ajouter un membre
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m: any) => {
            const avail      = AVAILABILITY_CONFIG[m.availability_status as MemberAvailabilityStatus] ?? AVAILABILITY_CONFIG.available
            const avatarColor = AVATAR_COLORS[m.full_name.charCodeAt(0) % AVATAR_COLORS.length]
            const isUnavail  = m.availability_status !== 'available'
            const photoSrc   = m.photo_url
              ? (m.photo_url.startsWith('http') ? m.photo_url : BACKEND + m.photo_url)
              : null

            return (
              <div key={m.id}
                className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:border-gray-200 hover:shadow-md transition-all">

                {/* Avatar */}
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 text-white text-base font-bold overflow-hidden ${photoSrc ? '' : avatarColor}`}>
                  {photoSrc ? (
                    <img src={photoSrc} alt={m.full_name} className="h-full w-full object-cover" />
                  ) : (
                    m.full_name.charAt(0).toUpperCase()
                  )}
                  {/* Availability dot */}
                  <span className={`absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${avail.dot}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{m.full_name}</p>
                    {m.category && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: m.category.color }}>
                        {m.category.label}
                      </span>
                    )}
                    {!m.is_active && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 shrink-0">
                        Inactif
                      </span>
                    )}
                    {isUnavail && (
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${avail.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
                        {avail.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {m.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="h-3 w-3 shrink-0" />{m.phone}
                      </span>
                    )}
                    {m.house ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[200px]">
                        <Home className="h-3 w-3 shrink-0 text-blue-400" />
                        {m.house.label ?? m.house.address}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Home className="h-3 w-3 shrink-0" /> Sans maison
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions — toujours visibles */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setDetailMember(m)}
                    title="Détail"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(m)}
                    title="Modifier"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-blue-500 hover:bg-blue-50 transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    disabled={deleteLoading}
                    title="Supprimer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
