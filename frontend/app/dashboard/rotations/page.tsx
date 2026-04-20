'use client'

import { useState } from 'react'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react'
import { RotateCcw, Plus, Wand2, Calendar, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { GET_ROTATIONS, SUGGEST_NEXT_HOUSE } from '@/graphql/queries/rotations'
import { GET_HOUSES } from '@/graphql/queries/families'
import {
  AUTO_SCHEDULE_ROTATION,
  SCHEDULE_ROTATION,
  UPDATE_ROTATION_STATUS,
} from '@/graphql/mutations/rotations'
import { Rotation } from '@/types'
import { formatDate } from '@/lib/utils'

const STATUS_CONFIG = {
  planned:   { label: 'Planifié',   color: 'bg-blue-100 text-blue-700'   },
  confirmed: { label: 'Confirmé',   color: 'bg-emerald-100 text-emerald-700' },
  done:      { label: 'Effectué',   color: 'bg-gray-100 text-gray-600'   },
  cancelled: { label: 'Annulé',     color: 'bg-red-100 text-red-600'     },
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  planned:   ['confirmed', 'cancelled'],
  confirmed: ['done', 'cancelled'],
  done:      [],
  cancelled: [],
}

export default function RotationsPage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [showAutoModal, setShowAutoModal]       = useState(false)
  const [showManualModal, setShowManualModal]   = useState(false)
  const [autoDate, setAutoDate]                 = useState(nextSundayStr())
  const [manualDate, setManualDate]             = useState(nextSundayStr())
  const [manualHouseId, setManualHouseId]       = useState('')
  const [suggestedHouse, setSuggestedHouse]     = useState<any>(null)
  const [filterStatus, setFilterStatus]         = useState<string>('all')

  const { data, loading, refetch } = useQuery(GET_ROTATIONS, {
    variables: { dahira_id: dahiraId, first: 30, page: 1 },
    skip: !dahiraId,
  })

  const { data: housesData } = useQuery(GET_HOUSES, {
    variables: { dahira_id: dahiraId, first: 100, page: 1 },
    skip: !dahiraId || !showManualModal,
  })

  const [suggestHouse, { loading: suggesting }] = useLazyQuery(SUGGEST_NEXT_HOUSE, {
    onCompleted: (d) => setSuggestedHouse(d.suggestNextHouse),
    onError: (e) => alert(e.message),
  })

  const [autoSchedule, { loading: autoLoading }] = useMutation(AUTO_SCHEDULE_ROTATION, {
    onCompleted: () => { setShowAutoModal(false); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [manualSchedule, { loading: manualLoading }] = useMutation(SCHEDULE_ROTATION, {
    onCompleted: () => { setShowManualModal(false); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [updateStatus] = useMutation(UPDATE_ROTATION_STATUS, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  })

  const rotations: Rotation[] = data?.rotations?.data ?? []
  const total = data?.rotations?.paginatorInfo?.total ?? 0
  const houses = housesData?.houses?.data ?? []

  const filtered = filterStatus === 'all'
    ? rotations
    : rotations.filter((r) => r.status === filterStatus)

  function handleAutoSuggest() {
    setSuggestedHouse(null)
    suggestHouse({ variables: { dahira_id: dahiraId, scheduled_date: autoDate } })
  }

  function handleAutoConfirm() {
    autoSchedule({ variables: { dahira_id: dahiraId, scheduled_date: autoDate } })
  }

  function handleManualSubmit() {
    if (!manualHouseId) return alert('Sélectionnez une maison')
    manualSchedule({ variables: { dahira_id: dahiraId, scheduled_date: manualDate, house_id: manualHouseId } })
  }

  return (
    <div className="space-y-6">
      {/* Modal Auto */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-emerald-600" />
              Planification automatique
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du tour</label>
                <input
                  type="date"
                  value={autoDate}
                  onChange={(e) => { setAutoDate(e.target.value); setSuggestedHouse(null) }}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <Button
                onClick={handleAutoSuggest}
                disabled={suggesting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {suggesting ? 'Analyse en cours...' : 'Suggérer la meilleure maison'}
              </Button>

              {suggestedHouse && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
                  <p className="text-sm font-semibold text-emerald-800">Maison recommandée</p>
                  <p className="text-base font-bold text-gray-900">
                    {suggestedHouse.label || suggestedHouse.address}
                  </p>
                  <p className="text-sm text-gray-600">Famille : {suggestedHouse.family?.name}</p>
                  <p className="text-sm text-gray-500">
                    Capacité : {suggestedHouse.capacity} · Passages reçus : {suggestedHouse.family?.total_received ?? 0}
                  </p>
                </div>
              )}

              {suggestedHouse === null && !suggesting && (
                <p className="text-sm text-gray-400 text-center">Cliquez sur "Suggérer" pour lancer l'algorithme</p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowAutoModal(false)}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={autoLoading}
                onClick={handleAutoConfirm}
              >
                {autoLoading ? 'Création...' : 'Confirmer le tour'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manuel */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Planification manuelle
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du tour</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maison</label>
                <select
                  value={manualHouseId}
                  onChange={(e) => setManualHouseId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Sélectionnez une maison...</option>
                  {houses.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.label || h.address} — {h.family?.name} (cap. {h.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowManualModal(false)}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={manualLoading}
                onClick={handleManualSubmit}
              >
                {manualLoading ? 'Création...' : 'Planifier'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tours de réunion</h1>
          <p className="text-sm text-gray-500 mt-1">{total} tours au total</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowManualModal(true)} variant="ghost" className="border border-gray-300">
            <Plus className="h-4 w-4" />
            Manuel
          </Button>
          <Button onClick={() => setShowAutoModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Wand2 className="h-4 w-4" />
            Auto-planifier
          </Button>
        </div>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'planned', 'confirmed', 'done', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'Tous' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
          </button>
        ))}
      </div>

      {/* Liste rotations */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <RotateCcw className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Aucun tour trouvé</p>
              <p className="text-sm text-gray-500 mt-1">Utilisez "Auto-planifier" pour créer le prochain tour</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((rotation: any) => {
            const cfg = STATUS_CONFIG[rotation.status as keyof typeof STATUS_CONFIG]
            const transitions = STATUS_TRANSITIONS[rotation.status] ?? []
            return (
              <Card key={rotation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
                        <Calendar className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {rotation.house?.label || rotation.house?.address}
                        </p>
                        <p className="text-sm text-gray-500">
                          Famille {rotation.house?.family?.name} · {formatDate(rotation.scheduled_date)}
                        </p>
                        {rotation.house?.neighborhood && (
                          <p className="text-xs text-gray-400 mt-0.5">{rotation.house.neighborhood}</p>
                        )}
                        {rotation.assignments?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {rotation.assignments.length} tâche(s) assignée(s)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {transitions.length > 0 && (
                        <div className="flex gap-1">
                          {transitions.map((next) => (
                            <button
                              key={next}
                              onClick={() => updateStatus({ variables: { id: rotation.id, status: next } })}
                              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              {next === 'confirmed' && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                              {next === 'done' && <CheckCircle className="h-3 w-3 text-gray-500" />}
                              {next === 'cancelled' && <XCircle className="h-3 w-3 text-red-400" />}
                              {STATUS_CONFIG[next as keyof typeof STATUS_CONFIG]?.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

function nextSundayStr(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = (7 - day) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}
