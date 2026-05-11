'use client'

/**
 * TourCustomPlanner — Planification personnalisée par glisser-déposer
 *
 * Fonctionnement :
 *  1. Charge tous les membres actifs du dahira
 *  2. Initialise la liste triée alphabétiquement (modifiable)
 *  3. Drag & drop via Pointer Events (souris + tactile, pas de lib externe)
 *  4. Date de départ + intervalle → calcul automatique de toutes les dates
 *  5. Maison pré-remplie depuis member.house, modifiable par select
 *  6. Confirmation avant génération, puis mutation planCustomRotations
 */

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import {
  X, GripVertical, Calendar, RotateCcw, Play,
  CheckCircle, AlertTriangle, Loader2, Users, ArrowLeftRight,
} from 'lucide-react'
import type { Member, House, Rotation } from '@/types'

import { GET_MEMBERS } from '@/graphql/queries/members'
import { GET_HOUSES } from '@/graphql/queries/families'
import { PLAN_CUSTOM_ROTATIONS, REORDER_ROTATIONS } from '@/graphql/mutations/rotations'

// ── Types internes ─────────────────────────────────────────────
interface PlannerRow {
  member:  Member
  houseId: string   // '' = pas de maison sélectionnée
}

export interface RotationReorderPlannerProps {
  dahiraId:  string
  rotations: Rotation[]
  onClose:   () => void
  onSuccess: () => void
}

export interface TourCustomPlannerProps {
  dahiraId:  string
  onClose:   () => void
  onSuccess: () => void
}

// ── Helpers ────────────────────────────────────────────────────
const INTERVALS = [
  { value: 1, label: '1 semaine'  },
  { value: 2, label: '2 semaines' },
  { value: 3, label: '3 semaines' },
  { value: 4, label: '4 semaines' },
]

function nextWeekday(dayOfWeek: number): string {
  // dayOfWeek : 0=dim, 1=lun, ..., 6=sam — retourne le prochain jour (jamais aujourd'hui)
  const d    = new Date()
  const diff = (dayOfWeek - d.getUTCDay() + 7) % 7 || 7
  d.setUTCDate(d.getUTCDate() + diff)
  return toIso(d)
}

function toIso(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addWeeks(iso: string, n: number): Date {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + n * 7)
  return d
}

function fmt(d: Date) {
  return d.toLocaleDateString('fr-SN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Component ──────────────────────────────────────────────────
export function TourCustomPlanner({ dahiraId, onClose, onSuccess }: TourCustomPlannerProps) {

  // ── Config ───────────────────────────────────────────────────
  const [startDate,     setStartDate]     = useState('')
  const [intervalWeeks, setIntervalWeeks] = useState(1)
  const [clearFuture,   setClearFuture]   = useState(false)

  // Initialise la date de départ côté client uniquement (SSR-safe)
  useEffect(() => {
    setStartDate(nextWeekday(0)) // prochain dimanche
  }, [])

  // ── Data ─────────────────────────────────────────────────────
  const { data: mData, loading: mLoading } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 300, page: 1 },
    skip: !dahiraId,
  })
  const { data: hData } = useQuery(GET_HOUSES, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })

  const allMembers: Member[] = useMemo(
    () => (mData?.members?.data ?? []).filter((m: Member) => m.is_active),
    [mData],
  )
  const allHouses: House[] = hData?.houses?.data ?? []

  // ── Rows (liste ordonnée) ─────────────────────────────────────
  const [rows, setRows] = useState<PlannerRow[]>([])
  const rowsInit = useRef(false)

  useEffect(() => {
    if (rowsInit.current || allMembers.length === 0) return
    rowsInit.current = true
    setRows(
      [...allMembers]
        .sort((a, b) =>
          a.full_name.localeCompare(b.full_name, 'fr', { sensitivity: 'base' }),
        )
        .map(m => ({ member: m, houseId: m.house?.id ?? '' })),
    )
  }, [allMembers])

  // ── Dates calculées ───────────────────────────────────────────
  const dates = useMemo(
    () => rows.map((_, i) => addWeeks(startDate || toIso(new Date()), i * intervalWeeks)),
    [rows, startDate, intervalWeeks],
  )

  // ── Drag & drop (Pointer Events — souris + tactile) ───────────
  const [dragFrom,   setDragFrom]   = useState<number | null>(null)
  const [dropAt,     setDropAt]     = useState<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const findTarget = useCallback((clientY: number): number => {
    let target = rows.length
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i]
      if (!el) continue
      const { top, height } = el.getBoundingClientRect()
      if (clientY < top + height / 2) { target = i; break }
      target = i + 1
    }
    return target
  }, [rows.length])

  function onHandleDown(e: React.PointerEvent<HTMLButtonElement>, idx: number) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragFrom(idx)
    setDropAt(idx)
  }

  function onHandleMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragFrom === null) return
    setDropAt(findTarget(e.clientY))
  }

  function onHandleUp() {
    if (dragFrom !== null && dropAt !== null && dragFrom !== dropAt) {
      const to   = dropAt > dragFrom ? dropAt - 1 : dropAt
      if (to !== dragFrom) {
        const next = [...rows]
        const [pulled] = next.splice(dragFrom, 1)
        next.splice(to, 0, pulled)
        setRows(next)
      }
    }
    setDragFrom(null)
    setDropAt(null)
  }

  // ── Mutation ──────────────────────────────────────────────────
  type Step = 'plan' | 'confirm' | 'generating' | 'done'
  const [step,           setStep]          = useState<Step>('plan')
  const [createdCount,   setCreatedCount]  = useState(0)
  const [skippedCount,   setSkippedCount]  = useState(0)

  const [planCustom] = useMutation(PLAN_CUSTOM_ROTATIONS, {
    onCompleted: d => {
      setCreatedCount(d.planCustomRotations.created_count)
      setSkippedCount(d.planCustomRotations.skipped_count)
      setStep('done')
      onSuccess()
    },
    onError: e => {
      alert(e.graphQLErrors?.[0]?.message ?? e.message)
      setStep('confirm')
    },
  })

  function handleGenerate() {
    setStep('generating')
    planCustom({
      variables: {
        dahira_id:    dahiraId,
        clear_future: clearFuture,
        entries: rows.map((r, i) => ({
          member_id:      r.member.id,
          house_id:       r.houseId || null,
          scheduled_date: toIso(dates[i]),
        })),
      },
    })
  }

  function setHouseForRow(idx: number, houseId: string) {
    setRows(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], houseId }
      return next
    })
  }

  // ── Render ────────────────────────────────────────────────────
  const endDate   = dates.length > 0 ? fmt(dates[dates.length - 1]) : '—'
  const startFmt  = startDate ? fmt(new Date(startDate)) : '—'
  const canSubmit = rows.length > 0 && startDate

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Planification personnalisée</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Glissez ⠿ pour réordonner · les dates se calculent automatiquement
              </p>
            </div>
            <button onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── STEP : plan / confirm ───────────────────────────── */}
        {(step === 'plan' || step === 'confirm') && (
          <>
            {/* Config bar */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Début</span>
                <input type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="h-8 rounded-lg border border-gray-200 px-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none bg-white" />
              </div>

              <div className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Intervalle</span>
                <select value={intervalWeeks}
                  onChange={e => setIntervalWeeks(Number(e.target.value))}
                  className="h-8 rounded-lg border border-gray-200 px-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none bg-white">
                  {INTERVALS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer ml-auto select-none">
                <input type="checkbox" checked={clearFuture}
                  onChange={e => setClearFuture(e.target.checked)}
                  className="rounded accent-red-500" />
                Effacer les tours futurs
              </label>
            </div>

            {/* Colonnes header */}
            <div className="grid grid-cols-[32px_1fr_150px_140px] gap-2 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/50 shrink-0">
              <span />
              <span>Membre</span>
              <span className="text-right">Date prévue</span>
              <span>Maison</span>
            </div>

            {/* Liste triable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {mLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <Users className="h-10 w-10 text-gray-200" />
                  <p className="text-sm text-gray-400">Aucun membre actif</p>
                </div>
              ) : (
                <div className="py-1">
                  {rows.map((row, i) => (
                    <div key={row.member.id}>

                      {/* Indicateur de drop au-dessus */}
                      {dragFrom !== null && dropAt === i && (
                        <div className="mx-6 h-0.5 rounded-full bg-emerald-500 my-0.5" />
                      )}

                      <div
                        ref={el => { itemRefs.current[i] = el }}
                        className={`grid grid-cols-[32px_1fr_150px_140px] gap-2 items-center px-4 py-2 transition-all select-none
                          ${dragFrom === i
                            ? 'opacity-30 bg-emerald-50 scale-[0.99]'
                            : 'hover:bg-gray-50/80'
                          }`}
                      >
                        {/* Handle */}
                        <button
                          onPointerDown={e => onHandleDown(e, i)}
                          onPointerMove={onHandleMove}
                          onPointerUp={onHandleUp}
                          className="flex items-center justify-center text-gray-300 hover:text-emerald-500 cursor-grab active:cursor-grabbing touch-none rounded-lg p-1 transition-colors"
                          aria-label="Déplacer"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>

                        {/* Membre */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 shrink-0">
                            {i + 1}
                          </span>
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold
                            ${['bg-emerald-500','bg-blue-500','bg-violet-500','bg-amber-500','bg-rose-500'][i % 5]}`}>
                            {row.member.first_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {row.member.full_name}
                          </span>
                          {row.member.category && (
                            <span
                              className="hidden sm:inline shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                              style={{ backgroundColor: row.member.category.color }}
                            >
                              {row.member.category.label}
                            </span>
                          )}
                        </div>

                        {/* Date */}
                        <p className="text-xs text-gray-500 text-right whitespace-nowrap pr-2">
                          {startDate ? fmt(dates[i]) : '—'}
                        </p>

                        {/* Maison */}
                        <select
                          value={row.houseId}
                          onChange={e => setHouseForRow(i, e.target.value)}
                          className="h-7 w-full rounded-lg border border-gray-200 px-1.5 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none bg-white"
                        >
                          <option value="">— aucune —</option>
                          {allHouses.map(h => (
                            <option key={h.id} value={h.id}>
                              {h.label ?? h.address}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {/* Indicateur de drop en bas de liste */}
                  {dragFrom !== null && dropAt === rows.length && (
                    <div className="mx-6 h-0.5 rounded-full bg-emerald-500 my-0.5" />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 shrink-0 space-y-3">
              {/* Résumé */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-800">{rows.length} rotations</strong>
                  {startDate && dates.length > 0 && (
                    <> &middot; du <strong>{startFmt}</strong> au <strong>{endDate}</strong></>
                  )}
                </p>
                <div className="flex gap-2">
                  <button onClick={onClose}
                    className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={!canSubmit}
                    className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors disabled:opacity-40 flex items-center gap-2">
                    <Play className="h-3.5 w-3.5" />
                    Générer
                  </button>
                </div>
              </div>

              {/* Confirmation inline */}
              {step === 'confirm' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900">
                        Créer {rows.length} rotations ?
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Du <strong>{startFmt}</strong> au <strong>{endDate}</strong>
                        {clearFuture && (
                          <span className="ml-1 text-red-600 font-semibold">
                            · Les tours futurs planifiés seront supprimés.
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setStep('plan')}
                        className="h-8 px-3 rounded-lg border border-amber-300 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
                        Modifier
                      </button>
                      <button onClick={handleGenerate}
                        className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Confirmer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STEP : generating ──────────────────────────────── */}
        {step === 'generating' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">Génération en cours…</p>
              <p className="text-xs text-gray-400 mt-1">{rows.length} rotations à créer</p>
            </div>
          </div>
        )}

        {/* ── STEP : done ────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">Planning généré !</p>
              <p className="text-sm text-gray-500 mt-1">
                <strong className="text-emerald-700">{createdCount}</strong> rotations créées
                {skippedCount > 0 && (
                  <span className="text-amber-600"> · {skippedCount} ignorées (dates déjà occupées)</span>
                )}
              </p>
            </div>
            <button onClick={onClose}
              className="mt-2 h-10 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors">
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  RotationReorderPlanner — Réorganisation des tours existants
// ══════════════════════════════════════════════════════════════
export function RotationReorderPlanner({
  dahiraId, rotations, onClose, onSuccess,
}: RotationReorderPlannerProps) {

  // Filtre : uniquement planned / confirmed, triés par date croissante
  const reorderableRotations = useMemo(
    () => [...rotations]
      .filter(r => r.status === 'planned' || r.status === 'confirmed')
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
    [rotations],
  )

  // Dates fixes (les créneaux) — ne bougent jamais
  const dateSlots = useMemo(
    () => reorderableRotations.map(r => r.scheduled_date),
    [reorderableRotations],
  )

  // Lignes triables — ordre modifié par le drag
  const [rows, setRows] = useState<Rotation[]>(reorderableRotations)

  // Changements calculés : rows[i] recevra dateSlots[i]
  const changes = useMemo(
    () => rows.map((row, i) => ({
      rotation: row,
      oldDate:  row.scheduled_date,
      newDate:  dateSlots[i] ?? row.scheduled_date,
      moved:    row.scheduled_date !== (dateSlots[i] ?? row.scheduled_date),
    })),
    [rows, dateSlots],
  )
  const movedCount = changes.filter(c => c.moved).length

  // ── Drag & drop ───────────────────────────────────────────────
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dropAt,   setDropAt]   = useState<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const findTarget = useCallback((clientY: number): number => {
    let target = rows.length
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i]
      if (!el) continue
      const { top, height } = el.getBoundingClientRect()
      if (clientY < top + height / 2) { target = i; break }
      target = i + 1
    }
    return target
  }, [rows.length])

  function onHandleDown(e: React.PointerEvent<HTMLButtonElement>, idx: number) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragFrom(idx)
    setDropAt(idx)
  }

  function onHandleMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragFrom === null) return
    setDropAt(findTarget(e.clientY))
  }

  function onHandleUp() {
    if (dragFrom !== null && dropAt !== null && dragFrom !== dropAt) {
      const to = dropAt > dragFrom ? dropAt - 1 : dropAt
      if (to !== dragFrom) {
        const next = [...rows]
        const [pulled] = next.splice(dragFrom, 1)
        next.splice(to, 0, pulled)
        setRows(next)
      }
    }
    setDragFrom(null)
    setDropAt(null)
  }

  // ── Mutation ──────────────────────────────────────────────────
  type Step = 'plan' | 'confirm' | 'saving' | 'done'
  const [step, setStep] = useState<Step>('plan')

  const [reorderMutation] = useMutation(REORDER_ROTATIONS, {
    onCompleted: () => { setStep('done'); onSuccess() },
    onError: e => {
      alert(e.graphQLErrors?.[0]?.message ?? e.message)
      setStep('confirm')
    },
  })

  function handleConfirm() {
    setStep('saving')
    reorderMutation({
      variables: {
        dahira_id:    dahiraId,
        rotation_ids: rows.map(r => r.id),
      },
    })
  }

  // ── Render ────────────────────────────────────────────────────
  const AVATAR_COLORS = [
    'bg-emerald-500', 'bg-blue-500', 'bg-violet-500',
    'bg-amber-500',   'bg-rose-500',
  ]

  if (reorderableRotations.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full sm:max-w-md rounded-2xl bg-white shadow-2xl p-8 text-center space-y-4">
          <p className="text-gray-500 text-sm">Aucun tour planifié ou confirmé à réordonner.</p>
          <button onClick={onClose}
            className="h-9 px-6 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Réordonner les tours</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Glissez ⠿ pour changer l&apos;ordre · les dates se redistribuent automatiquement
              </p>
            </div>
            <button onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── STEP : plan / confirm ───────────────────────────── */}
        {(step === 'plan' || step === 'confirm') && (
          <>
            {/* En-tête colonnes */}
            <div className="grid grid-cols-[32px_1fr_130px_130px] gap-2 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/50 shrink-0">
              <span />
              <span>Membre · Maison</span>
              <span className="text-right">Date actuelle</span>
              <span className="text-right">Nouvelle date</span>
            </div>

            {/* Liste triable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="py-1">
                {rows.map((row, i) => {
                  const change = changes[i]
                  const moved = change?.moved ?? false
                  return (
                    <div key={row.id}>
                      {/* Indicateur de drop au-dessus */}
                      {dragFrom !== null && dropAt === i && (
                        <div className="mx-6 h-0.5 rounded-full bg-orange-400 my-0.5" />
                      )}

                      <div
                        ref={el => { itemRefs.current[i] = el }}
                        className={`grid grid-cols-[32px_1fr_130px_130px] gap-2 items-center px-4 py-2.5 transition-all select-none
                          ${dragFrom === i
                            ? 'opacity-30 bg-orange-50 scale-[0.99]'
                            : moved
                              ? 'bg-orange-50/60 hover:bg-orange-50'
                              : 'hover:bg-gray-50/80'
                          }`}
                      >
                        {/* Handle */}
                        <button
                          onPointerDown={e => onHandleDown(e, i)}
                          onPointerMove={onHandleMove}
                          onPointerUp={onHandleUp}
                          className="flex items-center justify-center text-gray-300 hover:text-orange-400 cursor-grab active:cursor-grabbing touch-none rounded-lg p-1 transition-colors"
                          aria-label="Déplacer"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>

                        {/* Membre + maison */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold
                            ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                            {row.member?.full_name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {row.member?.full_name ?? 'Sans hôte'}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {row.house.label ?? row.house.address}
                            </p>
                          </div>
                          {moved && (
                            <span className="shrink-0 ml-1 rounded-full bg-orange-100 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                              Déplacé
                            </span>
                          )}
                        </div>

                        {/* Ancienne date */}
                        <p className={`text-xs text-right whitespace-nowrap pr-1 ${moved ? 'line-through text-gray-300' : 'text-gray-500'}`}>
                          {fmt(new Date(row.scheduled_date + 'T12:00:00'))}
                        </p>

                        {/* Nouvelle date */}
                        <p className={`text-xs text-right whitespace-nowrap font-semibold ${moved ? 'text-orange-600' : 'text-gray-400'}`}>
                          {moved ? fmt(new Date((change?.newDate ?? row.scheduled_date) + 'T12:00:00')) : '—'}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {/* Indicateur de drop en bas */}
                {dragFrom !== null && dropAt === rows.length && (
                  <div className="mx-6 h-0.5 rounded-full bg-orange-400 my-0.5" />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 shrink-0 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-800">{rows.length} tours</strong>
                  {movedCount > 0
                    ? <> · <span className="text-orange-600 font-semibold">{movedCount} déplacé{movedCount > 1 ? 's' : ''}</span></>
                    : <> · <span className="text-gray-400">Aucun changement</span></>
                  }
                </p>
                <div className="flex gap-2">
                  <button onClick={onClose}
                    className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={movedCount === 0}
                    className="h-9 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-semibold text-white transition-colors disabled:opacity-40 flex items-center gap-2">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Appliquer
                  </button>
                </div>
              </div>

              {/* Confirmation inline */}
              {step === 'confirm' && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-orange-900">
                        Confirmer le réordonnancement ?
                      </p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        <strong>{movedCount}</strong> tour{movedCount > 1 ? 's' : ''} vont changer de date. Cette action est réversible.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setStep('plan')}
                        className="h-8 px-3 rounded-lg border border-orange-300 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors">
                        Modifier
                      </button>
                      <button onClick={handleConfirm}
                        className="h-8 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white transition-colors flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Confirmer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STEP : saving ──────────────────────────────────── */}
        {step === 'saving' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <p className="text-sm font-bold text-gray-800">Mise à jour en cours…</p>
          </div>
        )}

        {/* ── STEP : done ────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">Réordonnancement appliqué !</p>
              <p className="text-sm text-gray-500 mt-1">
                <strong className="text-orange-600">{movedCount}</strong> tour{movedCount > 1 ? 's' : ''} mis à jour
              </p>
            </div>
            <button onClick={onClose}
              className="mt-2 h-10 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors">
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
