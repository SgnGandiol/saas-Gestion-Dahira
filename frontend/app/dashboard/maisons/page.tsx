'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { Home, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { GET_HOUSES } from '@/graphql/queries/families'
import { CREATE_HOUSE, UPDATE_HOUSE, DELETE_HOUSE } from '@/graphql/mutations/families'
import { House } from '@/types'

const houseSchema = z.object({
  label: z.string().optional().or(z.literal('')),
  address: z.string().min(5, 'Adresse requise (min. 5 caractères)'),
  neighborhood: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(1).optional(),
  min_interval_weeks: z.coerce.number().int().min(1).max(52).optional(),
  is_available: z.boolean(),
})

type HouseFormData = z.infer<typeof houseSchema>

export default function MaisonsPage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState<House | undefined>(undefined)
  const [formError, setFormError] = useState('')

  const { data, loading, refetch } = useQuery(GET_HOUSES, {
    variables: { dahira_id: dahiraId, first: 50, page: 1 },
    skip: !dahiraId,
  })

  const [createHouse, { loading: createLoading }] = useMutation(CREATE_HOUSE, {
    onCompleted: () => { refetch(); closeModal() },
    onError: (e) => setFormError(e.graphQLErrors?.[0]?.message ?? 'Erreur lors de la création'),
  })

  const [updateHouse, { loading: updateLoading }] = useMutation(UPDATE_HOUSE, {
    onCompleted: () => { refetch(); closeModal() },
    onError: (e) => setFormError(e.graphQLErrors?.[0]?.message ?? 'Erreur lors de la mise à jour'),
  })

  const [deleteHouse, { loading: deleteLoading }] = useMutation(DELETE_HOUSE, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const houses: House[] = data?.houses?.data ?? []
  const total = data?.houses?.paginatorInfo?.total ?? 0

  const filtered = houses.filter((h) =>
    (h.label ?? h.address).toLowerCase().includes(search.toLowerCase()) ||
    h.neighborhood?.toLowerCase().includes(search.toLowerCase())
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<HouseFormData>({
    resolver: zodResolver(houseSchema),
    defaultValues: { is_available: true, min_interval_weeks: 8, capacity: 30 },
  })

  function openCreate() {
    setSelectedHouse(undefined)
    reset({ is_available: true, min_interval_weeks: 8, capacity: 30 })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEdit(house: House) {
    setSelectedHouse(house)
    reset({
      label: house.label || '',
      address: house.address,
      neighborhood: house.neighborhood || '',
      capacity: house.capacity,
      min_interval_weeks: house.min_interval_weeks,
      is_available: house.is_available,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedHouse(undefined)
    setFormError('')
  }

  function onSubmit(data: HouseFormData) {
    setFormError('')
    const variables = {
      ...data,
      label: data.label || null,
      neighborhood: data.neighborhood || null,
    }
    if (selectedHouse) {
      updateHouse({ variables: { id: selectedHouse.id, ...variables } })
    } else {
      createHouse({ variables: { dahira_id: dahiraId, ...variables } })
    }
  }

  const isLoading = createLoading || updateLoading

  return (
    <div className="space-y-6">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedHouse ? 'Modifier la maison' : 'Nouvelle maison'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {formError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Libellé</label>
                  <Input type="text" placeholder="ex: Maison Ndiaye" {...register('label')} disabled={isLoading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse <span className="text-red-500">*</span>
                  </label>
                  <Input type="text" placeholder="123 rue des Peupliers" {...register('address')} disabled={isLoading} />
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quartier</label>
                  <Input type="text" placeholder="Liberté 6" {...register('neighborhood')} disabled={isLoading} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacité</label>
                    <Input type="number" min={1} {...register('capacity')} disabled={isLoading} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intervalle min (sem.)</label>
                    <Input type="number" min={1} max={52} {...register('min_interval_weeks')} disabled={isLoading} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_available"
                    {...register('is_available')}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                  />
                  <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                    Disponible pour les tours
                  </label>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                  {isLoading ? 'En cours...' : selectedHouse ? 'Mettre à jour' : 'Créer la maison'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maisons</h1>
          <p className="text-sm text-gray-500 mt-1">{total} maison{total > 1 ? 's' : ''} enregistrée{total > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Nouvelle maison
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une maison..."
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
                <Home className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Aucune maison trouvée</p>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Essayez un autre terme' : 'Commencez par ajouter une maison'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-medium text-gray-500">Maison</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Quartier</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Capacité</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Passages</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Statut</th>
                    <th className="pb-3 text-left font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{h.label || '—'}</p>
                        <p className="text-xs text-gray-500">{h.address}</p>
                      </td>
                      <td className="py-3 text-gray-600">{h.neighborhood ?? '—'}</td>
                      <td className="py-3 text-gray-600">{h.capacity}</td>
                      <td className="py-3 text-gray-600">{h.total_received}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          h.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {h.is_available ? 'Disponible' : 'Indisponible'}
                        </span>
                      </td>
                      <td className="py-3 flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(h)} className="text-blue-600 hover:bg-blue-50">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteLoading}
                          onClick={() => confirm(`Supprimer "${h.label ?? h.address}" ?`) && deleteHouse({ variables: { id: h.id } })}
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
