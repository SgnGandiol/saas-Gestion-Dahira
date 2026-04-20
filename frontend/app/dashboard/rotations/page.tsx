'use client'

import { useState } from 'react'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react'
import { RotateCcw, Plus, Wand2, Calendar, CheckCircle, XCircle, Clock, ChevronRight, CalendarRange, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { GET_ROTATIONS, SUGGEST_NEXT_HOUSE } from '@/graphql/queries/rotations'
import { GET_HOUSES } from '@/graphql/queries/families'
import {
  AUTO_SCHEDULE_ROTATION,
  SCHEDULE_ROTATION,
  UPDATE_ROTATION_STATUS,
  SCHEDULE_PERIOD_ROTATIONS,
  RESCHEDULE_ROTATION,
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
  const [showPeriodModal, setShowPeriodModal]   = useState(false)
  const [autoDate, setAutoDate]                 = useState(nextSundayStr())
  const [manualDate, setManualDate]             = useState(nextSundayStr())
  const [manualHouseId, setManualHouseId]       = useState('')
  const [suggestedHouse, setSuggestedHouse]     = useState<any>(null)
  const [filterStatus, setFilterStatus]         = useState<string>('all')
  const [periodStart, setPeriodStart]           = useState(nextSundayStr())
  const [periodPreset, setPeriodPreset]         = useState('1m')
  const [periodCustomEnd, setPeriodCustomEnd]   = useState('')
  const [periodResult, setPeriodResult]         = useState<{ created: number; skipped: number; skippedDates: string[] } | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<{ id: string; currentDate: string } | null>(null)
  const [rescheduleDate, setRescheduleDate]     = useState('')

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

  const [rescheduleRotation, { loading: rescheduleLoading }] = useMutation(RESCHEDULE_ROTATION, {
    onCompleted: () => { setRescheduleTarget(null); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [schedulePeriod, { loading: periodLoading }] = useMutation(SCHEDULE_PERIOD_ROTATIONS, {
    onCompleted: (d) => {
      refetch()
      setPeriodResult({
        created: d.schedulePeriodRotations.created_count,
        skipped: d.schedulePeriodRotations.skipped_count,
        skippedDates: d.schedulePeriodRotations.skipped_dates,
      })
    },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
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

  function getPeriodEndDate(): string {
    return periodPreset === 'custom' ? periodCustomEnd : addPeriod(periodStart, periodPreset)
  }

  function getPeriodSundayCount(): number {
    const end = getPeriodEndDate()
    if (!end) return 0
    return getSundaysBetween(periodStart, end).length
  }

  function handlePeriodSubmit() {
    const endDate = getPeriodEndDate()
    if (!endDate) return alert('Sélectionnez une date de fin')
    setPeriodResult(null)
    schedulePeriod({ variables: { dahira_id: dahiraId, start_date: periodStart, end_date: endDate } })
  }

  return (
    <div className="space-y-6">
      {/* Modal Repousser */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-orange-500" />
              Repousser le tour
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Date actuelle : <span className="font-medium text-gray-700">{formatDate(rescheduleTarget.currentDate)}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={rescheduleTarget.currentDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={rescheduleLoading || !rescheduleDate}
                onClick={() => rescheduleRotation({ variables: { id: rescheduleTarget.id, scheduled_date: rescheduleDate } })}
              >
                {rescheduleLoading ? 'Enregistrement...' : 'Repousser'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Période */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-purple-600" />
              Planifier une période
            </h2>

            {!periodResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">Le premier dimanche à partir de cette date sera le point de départ.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PERIOD_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPeriodPreset(p.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          periodPreset === p.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {periodPreset === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input
                      type="date"
                      value={periodCustomEnd}
                      onChange={(e) => setPeriodCustomEnd(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {getPeriodSundayCount() > 0 && (
                  <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3">
                    <p className="text-sm font-semibold text-purple-800">
                      {getPeriodSundayCount()} dimanches à planifier
                    </p>
                    <p className="text-xs text-purple-600 mt-0.5">
                      jusqu&apos;au {formatDate(getPeriodEndDate())}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowPeriodModal(false)}>
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={periodLoading || getPeriodSundayCount() === 0}
                    onClick={handlePeriodSubmit}
                  >
                    {periodLoading ? 'Planification...' : 'Planifier'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{periodResult.created}</p>
                  <p className="text-sm text-emerald-600">tour{periodResult.created > 1 ? 's' : ''} planifié{periodResult.created > 1 ? 's' : ''}</p>
                </div>
                {periodResult.skipped > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2">
                      {periodResult.skipped} dimanche{periodResult.skipped > 1 ? 's' : ''} ignoré{periodResult.skipped > 1 ? 's' : ''} (aucune maison disponible)
                    </p>
                    <ul className="space-y-0.5">
                      {periodResult.skippedDates.map((d) => (
                        <li key={d} className="text-xs text-amber-700">{formatDate(d)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowPeriodModal(false); setPeriodResult(null) }}>
                  Fermer
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

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
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
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
                  <p className="text-sm text-gray-500">
                    Capacité : {suggestedHouse.capacity} · Passages reçus : {suggestedHouse.total_received ?? 0}
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
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maison</label>
                <select
                  value={manualHouseId}
                  onChange={(e) => setManualHouseId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Sélectionnez une maison...</option>
                  {houses.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.label || h.address} (cap. {h.capacity})
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
          <h1 className="text-2xl font-bold text-gray-900">Tours de Dahira</h1>
          <p className="text-sm text-gray-500 mt-1">{total} tours au total</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowManualModal(true)} variant="ghost" className="border border-gray-300">
            <Plus className="h-4 w-4" />
            Manuel
          </Button>
          <Button onClick={() => { setPeriodResult(null); setShowPeriodModal(true) }} variant="ghost" className="border border-purple-300 text-purple-700 hover:bg-purple-50">
            <CalendarRange className="h-4 w-4" />
            Période
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 shrink-0">
                        <span className="text-lg font-bold text-white">
                          {rotation.member
                            ? rotation.member.full_name.charAt(0).toUpperCase()
                            : '?'}
                        </span>
                      </div>
                      <div>
                        {rotation.member ? (
                          <p className="font-bold text-gray-900 text-base leading-tight">
                            {rotation.member.full_name}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-amber-500">Aucun membre hôte assigné</p>
                        )}
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatDate(rotation.scheduled_date)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          🏠 {rotation.house?.label || rotation.house?.address}
                          {rotation.house?.neighborhood ? ` · ${rotation.house.neighborhood}` : ''}
                        </p>
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
                      <div className="flex flex-wrap gap-1 justify-end">
                        {['planned', 'confirmed'].includes(rotation.status) && (
                          <button
                            onClick={() => { setRescheduleDate(rotation.scheduled_date); setRescheduleTarget({ id: rotation.id, currentDate: rotation.scheduled_date }) }}
                            className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-600 hover:bg-orange-100 transition-colors"
                          >
                            <CalendarClock className="h-3 w-3" />
                            Repousser
                          </button>
                        )}
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

const PERIOD_PRESETS = [
  { value: '1w',     label: '1 semaine'   },
  { value: '2w',     label: '2 semaines'  },
  { value: '3w',     label: '3 semaines'  },
  { value: '1m',     label: '1 mois'      },
  { value: '3m',     label: '3 mois'      },
  { value: '6m',     label: '6 mois'      },
  { value: '1y',     label: '1 an'        },
  { value: 'custom', label: 'Personnalisé' },
]

function addPeriod(dateStr: string, preset: string): string {
  const d = new Date(dateStr)
  // For week presets: end = start + (n-1)*7 so exactly n Sundays are included
  switch (preset) {
    case '1w': break                                      // end = start → 1 Sunday
    case '2w': d.setDate(d.getDate() + 7); break         // 2 Sundays
    case '3w': d.setDate(d.getDate() + 14); break        // 3 Sundays
    case '1m': d.setMonth(d.getMonth() + 1); break
    case '3m': d.setMonth(d.getMonth() + 3); break
    case '6m': d.setMonth(d.getMonth() + 6); break
    case '1y': d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().split('T')[0]
}

function getSundaysBetween(startStr: string, endStr: string): string[] {
  const sundays: string[] = []
  const d = new Date(startStr)
  const end = new Date(endStr)
  if (d.getDay() !== 0) d.setDate(d.getDate() + (7 - d.getDay()))
  while (d <= end) {
    sundays.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 7)
  }
  return sundays
}
