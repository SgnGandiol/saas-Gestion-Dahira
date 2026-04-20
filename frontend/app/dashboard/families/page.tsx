'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Home, Plus, Edit2, Users, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { GET_FAMILIES } from '@/graphql/queries/families'
import { CREATE_FAMILY, UPDATE_FAMILY, CREATE_HOUSE } from '@/graphql/mutations/families'
import { formatDate } from '@/lib/utils'

type ModalMode = 'family-create' | 'family-edit' | 'house-create' | null

export default function FamiliesPage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [modal, setModal]                     = useState<ModalMode>(null)
  const [selectedFamily, setSelectedFamily]   = useState<any>(null)
  const [search, setSearch]                   = useState('')

  // Family form state
  const [fname, setFname]           = useState('')
  const [faddress, setFaddress]     = useState('')
  const [fneighbor, setFneighbor]   = useState('')
  const [fphone, setFphone]         = useState('')
  const [fcapacity, setFcapacity]   = useState('20')
  const [favail, setFavail]         = useState(true)

  // House form state
  const [hlabel, setHlabel]         = useState('')
  const [haddress, setHaddress]     = useState('')
  const [hneighbor, setHneighbor]   = useState('')
  const [hcapacity, setHcapacity]   = useState('30')
  const [hinterval, setHinterval]   = useState('8')

  const { data, loading, refetch } = useQuery(GET_FAMILIES, {
    variables: { dahira_id: dahiraId, first: 50, page: 1 },
    skip: !dahiraId,
  })

  const [createFamily, { loading: creating }] = useMutation(CREATE_FAMILY, {
    onCompleted: () => { closeModal(); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [updateFamily, { loading: updating }] = useMutation(UPDATE_FAMILY, {
    onCompleted: () => { closeModal(); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [createHouse, { loading: creatingHouse }] = useMutation(CREATE_HOUSE, {
    onCompleted: () => { closeModal(); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const families = data?.families?.data ?? []
  const total    = data?.families?.paginatorInfo?.total ?? 0

  const filtered = families.filter((f: any) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.address?.toLowerCase().includes(search.toLowerCase())
  )

  function openCreateFamily() {
    setFname(''); setFaddress(''); setFneighbor(''); setFphone(''); setFcapacity('20'); setFavail(true)
    setModal('family-create')
  }

  function openEditFamily(family: any) {
    setSelectedFamily(family)
    setFname(family.name); setFaddress(family.address ?? ''); setFneighbor(family.neighborhood ?? '')
    setFphone(family.phone ?? ''); setFcapacity(String(family.capacity)); setFavail(family.is_available)
    setModal('family-edit')
  }

  function openCreateHouse(family: any) {
    setSelectedFamily(family)
    setHlabel(''); setHaddress(family.address ?? ''); setHneighbor(family.neighborhood ?? '')
    setHcapacity('30'); setHinterval('8')
    setModal('house-create')
  }

  function closeModal() {
    setModal(null); setSelectedFamily(null)
  }

  function submitFamily() {
    const vars = {
      name: fname, address: faddress || undefined, neighborhood: fneighbor || undefined,
      phone: fphone || undefined, capacity: parseInt(fcapacity), is_available: favail,
    }
    if (modal === 'family-create') {
      createFamily({ variables: { dahira_id: dahiraId, ...vars } })
    } else {
      updateFamily({ variables: { id: selectedFamily.id, ...vars } })
    }
  }

  function submitHouse() {
    if (!haddress) return alert("L'adresse est obligatoire")
    createHouse({
      variables: {
        dahira_id: dahiraId, family_id: selectedFamily.id,
        label: hlabel || undefined, address: haddress,
        neighborhood: hneighbor || undefined,
        capacity: parseInt(hcapacity), min_interval_weeks: parseInt(hinterval),
      },
    })
  }

  const isMutating = creating || updating || creatingHouse

  return (
    <div className="space-y-6">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {modal === 'family-create' && 'Ajouter une famille'}
              {modal === 'family-edit'   && 'Modifier la famille'}
              {modal === 'house-create'  && `Ajouter une maison — ${selectedFamily?.name}`}
            </h2>

            {modal !== 'house-create' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de famille <span className="text-red-500">*</span></label>
                  <Input value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Famille Ndiaye" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <Input value={faddress} onChange={(e) => setFaddress(e.target.value)} placeholder="Rue 10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
                    <Input value={fneighbor} onChange={(e) => setFneighbor(e.target.value)} placeholder="Médina" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <Input value={fphone} onChange={(e) => setFphone(e.target.value)} placeholder="+221 77..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                    <Input type="number" min="1" value={fcapacity} onChange={(e) => setFcapacity(e.target.value)} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={favail} onChange={(e) => setFavail(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">Disponible pour accueillir</span>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                    <Input value={hlabel} onChange={(e) => setHlabel(e.target.value)} placeholder="Villa Ndiaye" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse <span className="text-red-500">*</span></label>
                    <Input value={haddress} onChange={(e) => setHaddress(e.target.value)} placeholder="Rue 10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
                    <Input value={hneighbor} onChange={(e) => setHneighbor(e.target.value)} placeholder="Médina" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                    <Input type="number" min="1" value={hcapacity} onChange={(e) => setHcapacity(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intervalle minimum (semaines)
                  </label>
                  <Input type="number" min="1" value={hinterval} onChange={(e) => setHinterval(e.target.value)} />
                  <p className="mt-1 text-xs text-gray-400">Délai minimum entre deux passages dans cette maison</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={closeModal}>Annuler</Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={isMutating || (modal !== 'house-create' && !fname)}
                onClick={modal === 'house-create' ? submitHouse : submitFamily}
              >
                {isMutating ? 'En cours...' : modal === 'family-edit' ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Familles & Maisons</h1>
          <p className="text-sm text-gray-500 mt-1">{total} famille(s) enregistrée(s)</p>
        </div>
        <Button onClick={openCreateFamily} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Ajouter une famille
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Rechercher une famille..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 pl-4 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Grille familles */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">Aucune famille trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Commencez par enregistrer une famille</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((family: any) => (
            <Card key={family.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                {/* Header famille */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{family.name}</h3>
                    {family.address && (
                      <p className="text-xs text-gray-500 mt-0.5">{family.neighborhood ? `${family.neighborhood} · ` : ''}{family.address}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditFamily(family)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-lg font-bold text-gray-900">{family.members?.length ?? 0}</p>
                    <p className="text-xs text-gray-500">Membres</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-lg font-bold text-gray-900">{family.total_received}</p>
                    <p className="text-xs text-gray-500">Tours reçus</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-lg font-bold text-gray-900">{family.capacity}</p>
                    <p className="text-xs text-gray-500">Capacité</p>
                  </div>
                </div>

                {/* Disponibilité */}
                <div className="flex items-center gap-1.5 mb-3">
                  {family.is_available ? (
                    <><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs text-emerald-700">Disponible</span></>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5 text-red-400" /><span className="text-xs text-red-600">Indisponible</span></>
                  )}
                  {family.last_received_at && (
                    <span className="ml-auto text-xs text-gray-400">Dernier : {formatDate(family.last_received_at)}</span>
                  )}
                </div>

                {/* Maison liée */}
                {family.house ? (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-700">
                        {family.house.label || family.house.address}
                      </span>
                      <span className={`ml-auto rounded-full px-1.5 py-0.5 text-xs ${
                        family.house.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        cap. {family.house.capacity}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openCreateHouse(family)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter une maison
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
