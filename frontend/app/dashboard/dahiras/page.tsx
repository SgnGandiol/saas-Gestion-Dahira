'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { Building2, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DahiraModal } from '@/components/dahiras/DahiraModal'
import { useAuthStore } from '@/store/auth.store'
import { GET_DAHIRAS } from '@/graphql/queries/dahiras'
import { DELETE_DAHIRA } from '@/graphql/mutations/dahiras'
import { Dahira } from '@/types'

export default function DahirasPage() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDahira, setSelectedDahira] = useState<Dahira | undefined>(undefined)

  const { data, loading, refetch } = useQuery(GET_DAHIRAS)

  const [deleteDahira, { loading: deleteLoading }] = useMutation(DELETE_DAHIRA, {
    onCompleted: () => refetch(),
    onError: (err) => alert('Erreur : ' + (err.graphQLErrors?.[0]?.message ?? err.message)),
  })

  const dahiras: Dahira[] = data?.dahiras ?? []

  const filtered = dahiras.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.city?.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenModal = (dahira?: Dahira) => {
    setSelectedDahira(dahira)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) {
      deleteDahira({ variables: { id } })
    }
  }

  return (
    <div className="space-y-6">
      <DahiraModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedDahira(undefined) }}
        onSuccess={() => refetch()}
        dahira={selectedDahira}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dahiras</h1>
          <p className="text-sm text-gray-500 mt-1">{dahiras.length} dahira{dahiras.length > 1 ? 's' : ''} enregistrée{dahiras.length > 1 ? 's' : ''}</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Nouvelle Dahira
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une dahira..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
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
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Aucune dahira trouvée</p>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Essayez un autre terme' : 'Commencez par créer une dahira'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-medium text-gray-500">Nom</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Ville</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Pays</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Contact</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Statut</th>
                    {isSuperAdmin && (
                      <th className="pb-3 text-left font-medium text-gray-500">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-900">{d.name}</td>
                      <td className="py-3 text-gray-600">{d.city ?? '—'}</td>
                      <td className="py-3 text-gray-600">{d.country}</td>
                      <td className="py-3 text-gray-600">
                        {d.phone ?? d.email ?? '—'}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          d.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(d)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(d.id, d.name)}
                            disabled={deleteLoading}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
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
