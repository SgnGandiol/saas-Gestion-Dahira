'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MemberModal } from '@/components/members/MemberModal'
import { useAuthStore } from '@/store/auth.store'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { DELETE_MEMBER } from '@/graphql/mutations/members'
import { Member } from '@/types'

export default function MembersPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined)

  const { data, loading, refetch } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: user?.dahira?.id, first: 20, page: 1 },
    skip: !user?.dahira?.id,
  })

  const [deleteMember, { loading: deleteLoading }] = useMutation(DELETE_MEMBER, {
    onCompleted: () => {
      refetch()
    },
    onError: (err) => {
      alert('Erreur lors de la suppression: ' + (err?.graphQLErrors?.[0]?.message ?? err.message))
    },
  })

  const members = data?.members?.data ?? []
  const total = data?.members?.paginatorInfo?.total ?? 0

  const filtered = members.filter((m: { full_name: string; phone?: string }) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  )

  const handleDeleteMember = (id: string) => {
    if (confirm('Êtes-vous sûr ? Cette action est irréversible.')) {
      deleteMember({ variables: { id } })
    }
  }

  const handleOpenModal = (member?: Member) => {
    setSelectedMember(member)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedMember(undefined)
  }

  const handleModalSuccess = () => {
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* Modal */}
      <MemberModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        dahiraId={user?.dahira?.id || ''}
        member={selectedMember}
      />

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
          <p className="text-sm text-gray-500 mt-1">{total} membres au total</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Ajouter un membre
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Aucun membre trouvé</p>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Essayez un autre terme de recherche' : 'Commencez par ajouter des membres'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-medium text-gray-500">Nom complet</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Téléphone</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Famille</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Statut</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((m: any) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-900">
                        {m.full_name}
                        {m.is_family_head && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Chef
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600">{m.phone ?? '—'}</td>
                      <td className="py-3 text-gray-600">{m.family?.name ?? '—'}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          m.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {m.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(m)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(m.id)}
                          disabled={deleteLoading}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
