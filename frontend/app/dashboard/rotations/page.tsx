'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react'
import {
  RotateCcw, Plus, Wand2, Calendar, CheckCircle, XCircle, Clock,
  ChevronRight, CalendarRange, CalendarClock, Search, X, Home,
  Lightbulb, History, RefreshCw, AlertTriangle, Building2,
  ArrowLeftRight, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { GET_ROTATIONS, SUGGEST_NEXT_HOUSE } from '@/graphql/queries/rotations'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { GET_ROTATION_LOGS, SUGGEST_BEST_SOLUTION, PREVIEW_REBUILD } from '@/graphql/queries/rotationEngine'
import { PREVIEW_CASCADE } from '@/graphql/queries/cascade'
import {
  AUTO_SCHEDULE_ROTATION,
  SCHEDULE_ROTATION,
  UPDATE_ROTATION_STATUS,
  SCHEDULE_PERIOD_ROTATIONS,
} from '@/graphql/mutations/rotations'
import { RESCHEDULE_ROTATION, CANCEL_ROTATION } from '@/graphql/mutations/cascade'
import {
  UPDATE_MEMBER_AVAILABILITY,
  APPLY_ROTATION_SOLUTION,
  APPLY_REBUILD,
} from '@/graphql/mutations/rotationEngine'
import { Rotation, MemberAvailabilityStatus, CascadePreview, RotationMotif } from '@/types'
import { formatDate } from '@/lib/utils'

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planned:      { label: 'Planifié',  color: 'bg-blue-100 text-blue-700'       },
  confirmed:    { label: 'Confirmé',  color: 'bg-emerald-100 text-emerald-700' },
  ongoing:      { label: 'En cours',  color: 'bg-amber-100 text-amber-700'     },
  completed:    { label: 'Effectué',  color: 'bg-gray-100 text-gray-600'       },
  cancelled:    { label: 'Annulé',    color: 'bg-red-100 text-red-600'         },
  rescheduled:  { label: 'Reporté',   color: 'bg-orange-100 text-orange-700'   },
  headquarters: { label: 'Siège',     color: 'bg-purple-100 text-purple-700'   },
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  planned:      ['confirmed', 'cancelled'],
  confirmed:    ['ongoing',   'cancelled'],
  ongoing:      ['completed', 'cancelled'],
  completed:    [],
  cancelled:    [],
  rescheduled:  ['confirmed', 'cancelled'],
  headquarters: ['completed', 'cancelled'],
}

const AVAILABILITY_CONFIG: Record<MemberAvailabilityStatus, { label: string; dot: string }> = {
  available:   { label: 'Disponible',   dot: 'bg-emerald-500' },
  unavailable: { label: 'Indisponible', dot: 'bg-red-500'     },
  travel:      { label: 'Voyage',       dot: 'bg-amber-500'   },
  sick:        { label: 'Malade',       dot: 'bg-orange-500'  },
  suspended:   { label: 'Suspendu',     dot: 'bg-gray-400'    },
}

const REBUILD_MODES = [
  { value: 'balanced',   label: 'Équilibré',   desc: 'Priorité équité maximale' },
  { value: 'stable',     label: 'Stable',      desc: 'Modifier le moins possible' },
  { value: 'geographic', label: 'Géographique',desc: 'Optimise proximité' },
  { value: 'urgent',     label: 'Urgent',      desc: 'Reconstruction rapide' },
]

// ─── Motif config (grouped) ───────────────────────────────────
const MOTIF_OPTIONS: { value: RotationMotif; label: string; group: string }[] = [
  { value: 'ABSENCE',        label: 'Absence',                 group: 'Personne' },
  { value: 'SICKNESS',       label: 'Maladie',                 group: 'Personne' },
  { value: 'TRAVEL',         label: 'Voyage',                  group: 'Personne' },
  { value: 'DEATH',          label: 'Décès',                   group: 'Personne' },
  { value: 'WEDDING',        label: 'Mariage / Baptême',       group: 'Personne' },
  { value: 'RAMADAN',        label: 'Ramadan',                 group: 'Calendrier' },
  { value: 'MAGAL',          label: 'Magal',                   group: 'Calendrier' },
  { value: 'GAMOU',          label: 'Gamou',                   group: 'Calendrier' },
  { value: 'RELIGIOUS_EVENT',label: 'Autre événement religieux',group: 'Calendrier' },
  { value: 'FLOOD',          label: 'Inondation',              group: 'Logistique' },
  { value: 'LOGISTICS',      label: 'Problème logistique',     group: 'Logistique' },
  { value: 'PLANNING_ERROR', label: 'Erreur de planification', group: 'Planning' },
  { value: 'REBALANCE',      label: 'Rééquilibrage',           group: 'Planning' },
  { value: 'OTHER',          label: 'Autre',                   group: 'Autre' },
]

const RESCHEDULE_MODES = [
  { value: 'HEADQUARTERS', label: 'Tenir au siège',        desc: 'La dahira a lieu au siège cette date, personne ne se déplace',  icon: '🏛️' },
  { value: 'CHAIN',        label: 'Décaler tout le monde', desc: 'Tous les tours suivants glissent du même nombre de semaines',   icon: '⛓️' },
  { value: 'SWAP',         label: 'Échanger avec le suivant',desc: 'Ce tour et le prochain échangent leurs dates',              icon: '↔️' },
  { value: 'GAP',          label: 'Laisser un vide',       desc: 'Seul ce tour bouge, les autres gardent leurs dates',           icon: '📭' },
]

const CANCEL_MODES = [
  { value: 'HEADQUARTERS', label: 'Tenir au siège à la place', desc: 'La dahira a lieu au siège, le planning reste intact',        icon: '🏛️' },
  { value: 'FILL',         label: 'Avancer les suivants',      desc: 'Les tours suivants avancent d\'une semaine pour combler le vide',icon: '⬆️' },
  { value: 'GAP',          label: 'Laisser un vide',           desc: 'Aucune dahira ce dimanche, le planning reste en l\'état',     icon: '📭' },
]

// ─── Helper ───────────────────────────────────────────────────
function MotifSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const groups = [...new Set(MOTIF_OPTIONS.map(m => m.group))]
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none bg-white"
    >
      <option value="">— Choisir un motif —</option>
      {groups.map(group => (
        <optgroup key={group} label={group}>
          {MOTIF_OPTIONS.filter(m => m.group === group).map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function CascadePreviewTable({ preview }: { preview: CascadePreview }) {
  const changed = preview.items.filter(i => !i.is_locked && i.old_date !== i.new_date)
  const locked  = preview.items.filter(i => i.is_locked)
  if (preview.items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Aucun tour à décaler</p>
  }
  return (
    <div className="space-y-2">
      {preview.has_locked_warning && locked.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span><strong>{locked.length} tour(s) verrouillé(s)</strong> — zone &lt; 14 jours, non déplacé(s)</span>
        </div>
      )}
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {preview.items.map(item => (
          <div key={item.rotation_id}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs ${
              item.is_locked ? 'bg-gray-50 text-gray-400 border border-gray-100'
              : item.old_date !== item.new_date ? 'bg-amber-50 border border-amber-200 text-gray-700'
              : 'bg-gray-50 border border-gray-100 text-gray-400'
            }`}>
            <span className="font-medium truncate">{item.member_name ?? '—'}</span>
            <span className="flex items-center gap-1 shrink-0">
              <span className={item.is_locked ? 'line-through' : item.old_date !== item.new_date ? 'line-through text-red-400' : ''}>
                {formatDate(item.old_date)}
              </span>
              {!item.is_locked && item.old_date !== item.new_date && (
                <>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="text-emerald-600 font-semibold">{formatDate(item.new_date)}</span>
                </>
              )}
              {item.is_locked && <span className="ml-1 text-gray-400">🔒</span>}
            </span>
          </div>
        ))}
      </div>
      {changed.length > 0 && (
        <p className="text-[11px] text-gray-400 text-right">
          {changed.length} tour(s) décalé(s)
          {locked.length > 0 && ` · ${locked.length} verrouillé(s)`}
        </p>
      )}
    </div>
  )
}

export default function RotationsPage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  // ── Modal states ──────────────────────────────────────────────
  const [showAutoModal, setShowAutoModal]         = useState(false)
  const [showManualModal, setShowManualModal]     = useState(false)
  const [showPeriodModal, setShowPeriodModal]     = useState(false)
  const [showSolutionModal, setShowSolutionModal] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [showRebuildModal, setShowRebuildModal]   = useState(false)
  // Reschedule modal (new)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleTarget, setRescheduleTarget]       = useState<any>(null)
  const [rescheduleMode, setRescheduleMode]           = useState('CHAIN')
  const [rescheduleMotif, setRescheduleMotif]         = useState('')
  const [rescheduleMotifDetail, setRescheduleMotifDetail] = useState('')
  const [rescheduleShiftWeeks, setRescheduleShiftWeeks]   = useState(1)
  const [rescheduleCustomDate, setRescheduleCustomDate]   = useState('')
  const [rescheduleCascadePreview, setRescheduleCascadePreview] = useState<CascadePreview | null>(null)
  const [rescheduleStep, setRescheduleStep]         = useState<'form' | 'preview' | 'done'>('form')
  // Cancel modal (new)
  const [showCancelModal, setShowCancelModal]     = useState(false)
  const [cancelTarget, setCancelTarget]           = useState<any>(null)
  const [cancelMode, setCancelMode]               = useState('HEADQUARTERS')
  const [cancelMotif, setCancelMotif]             = useState('')
  const [cancelMotifDetail, setCancelMotifDetail] = useState('')
  const [cancelStep, setCancelStep]               = useState<'form' | 'done'>('form')

  // ── Manual form state ─────────────────────────────────────────
  const [autoDate, setAutoDate]             = useState(nextSundayStr())
  const [manualDate, setManualDate]         = useState(nextSundayStr())
  const [manualMemberId, setManualMemberId] = useState('')
  const [manualSearch, setManualSearch]     = useState('')
  const [forceRebuild, setForceRebuild]     = useState(false)
  const [manualConflictMode, setManualConflictMode] = useState<'INSERT' | 'REPLACE'>('INSERT')
  const [manualNotes, setManualNotes]       = useState('')
  const [manualResult, setManualResult]     = useState<{ rebuildCount: number; replaced: boolean } | null>(null)
  const [suggestedHouse, setSuggestedHouse] = useState<any>(undefined)
  const [subTab, setSubTab]                 = useState<'passes' | 'prochain' | 'avenir'>('prochain')
  const [periodStart, setPeriodStart]       = useState(nextSundayStr())
  const [periodPreset, setPeriodPreset]     = useState('1m')
  const [periodCustomEnd, setPeriodCustomEnd] = useState('')
  const [periodResult, setPeriodResult]     = useState<{ created: number; skipped: number; skippedDates: string[] } | null>(null)

  // ── Solution + History + Rebuild state ───────────────────────
  const [solutionRotation, setSolutionRotation]   = useState<any>(null)
  const [solutionReason, setSolutionReason]       = useState('absence')
  const [applyingSolution, setApplyingSolution]   = useState<string | null>(null)
  const [historyRotation, setHistoryRotation]     = useState<any>(null)
  const [rebuildWeeks, setRebuildWeeks]           = useState(12)
  const [rebuildMode, setRebuildMode]             = useState('balanced')
  const [rebuildPreview, setRebuildPreview]       = useState<any>(null)
  const [rebuildApplied, setRebuildApplied]       = useState(false)

  // ── Queries ───────────────────────────────────────────────────
  const { data, loading, refetch } = useQuery(GET_ROTATIONS, {
    variables: { dahira_id: dahiraId, first: 30, page: 1 },
    skip: !dahiraId,
  })

  const { data: membersData } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId || !showManualModal,
  })

  const [suggestHouse, { loading: suggesting }] = useLazyQuery(SUGGEST_NEXT_HOUSE, {
    onCompleted: (d) => setSuggestedHouse(d.suggestNextHouse),
    onError: (e) => alert(e.message),
  })

  const [loadSolution, { data: solutionData, loading: solutionLoading }] = useLazyQuery(SUGGEST_BEST_SOLUTION, {
    fetchPolicy: 'network-only',
  })

  const [loadHistory, { data: historyData, loading: historyLoading }] = useLazyQuery(GET_ROTATION_LOGS, {
    fetchPolicy: 'network-only',
  })

  const [loadRebuildPreview, { loading: previewLoading }] = useLazyQuery(PREVIEW_REBUILD, {
    fetchPolicy: 'network-only',
  })

  const [loadCascadePreview, { loading: cascadePreviewLoading }] = useLazyQuery(PREVIEW_CASCADE, {
    fetchPolicy: 'network-only',
  })

  // ── Mutations ─────────────────────────────────────────────────
  const [autoSchedule, { loading: autoLoading }] = useMutation(AUTO_SCHEDULE_ROTATION, {
    onCompleted: () => { setShowAutoModal(false); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [manualSchedule, { loading: manualLoading }] = useMutation(SCHEDULE_ROTATION, {
    onCompleted: (d) => {
      refetch()
      const payload = d.scheduleRotation
      if (payload.rebuild_applied && payload.rebuild_count > 0) {
        setManualResult({ rebuildCount: payload.rebuild_count, replaced: !!payload.replaced_rotation })
      } else {
        closeManualModal()
      }
    },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [updateStatus] = useMutation(UPDATE_ROTATION_STATUS, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.message),
  })

  const [rescheduleRotation, { loading: rescheduleLoading }] = useMutation(RESCHEDULE_ROTATION, {
    onCompleted: () => { setRescheduleStep('done') ; refetch() },
    onError: (e) => { alert(e.graphQLErrors?.[0]?.message ?? e.message) },
  })

  const [cancelRotation, { loading: cancelLoading }] = useMutation(CANCEL_ROTATION, {
    onCompleted: () => { setCancelStep('done'); refetch() },
    onError: (e) => { alert(e.graphQLErrors?.[0]?.message ?? e.message) },
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

  const [applySolution] = useMutation(APPLY_ROTATION_SOLUTION, {
    onCompleted: () => { setShowSolutionModal(false); setApplyingSolution(null); refetch() },
    onError: (e) => { alert(e.graphQLErrors?.[0]?.message ?? e.message); setApplyingSolution(null) },
  })

  const [applyRebuild, { loading: applyingRebuild }] = useMutation(APPLY_REBUILD, {
    onCompleted: () => { setRebuildApplied(true); refetch() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  // ── Computed ──────────────────────────────────────────────────
  const rotations: Rotation[] = useMemo(() =>
    [...(data?.rotations?.data ?? [])].sort((a: any, b: any) =>
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    ), [data]
  )
  const total = data?.rotations?.paginatorInfo?.total ?? 0

  const allMembers: any[] = useMemo(() =>
    (membersData?.members?.data ?? [])
      .filter((m: any) => m.is_active !== false && m.house)
      .sort((a: any, b: any) => (a.full_name ?? '').localeCompare(b.full_name ?? '')),
    [membersData]
  )

  const PAST_STATUSES   = ['completed', 'cancelled', 'headquarters']
  const FUTURE_STATUSES = ['planned', 'confirmed', 'ongoing', 'rescheduled']
  const pastTours       = rotations.filter(r => PAST_STATUSES.includes(r.status)).reverse()
  const futureTours     = rotations.filter(r => FUTURE_STATUSES.includes(r.status))
  const nextTour        = futureTours[0] ?? null
  const upcomingTours   = futureTours.slice(1)

  // Client-side conflict detection for manual creation
  const manualDateTaken = useMemo(() =>
    rotations.some((r: any) => r.scheduled_date === manualDate && ['planned','confirmed'].includes(r.status)),
    [rotations, manualDate]
  )

  const solutions   = solutionData?.suggestBestSolution?.all_solutions ?? []
  const historyLogs = historyData?.rotationLogs ?? []

  // ── Handlers ──────────────────────────────────────────────────
  function handleAutoSuggest() {
    setSuggestedHouse(undefined)
    suggestHouse({ variables: { dahira_id: dahiraId, scheduled_date: autoDate } })
  }

  function handleAutoConfirm() {
    autoSchedule({ variables: { dahira_id: dahiraId, scheduled_date: autoDate } })
  }

  function handleManualSubmit() {
    if (!manualMemberId) return alert('Sélectionnez un membre')
    setManualResult(null)
    manualSchedule({
      variables: {
        dahira_id:    dahiraId,
        scheduled_date: manualDate,
        member_id:    manualMemberId,
        insert_mode:  manualDateTaken ? manualConflictMode === 'INSERT' : false,
        force_rebuild:manualDateTaken && manualConflictMode === 'REPLACE',
        notes:        manualNotes || undefined,
      },
    })
  }

  function closeManualModal() {
    setShowManualModal(false)
    setManualMemberId('')
    setManualSearch('')
    setForceRebuild(false)
    setManualNotes('')
    setManualResult(null)
  }

  // ── Reschedule handlers ───────────────────────────────────────
  function openRescheduleModal(rotation: any) {
    setRescheduleTarget(rotation)
    setRescheduleMode('CHAIN')
    setRescheduleMotif('')
    setRescheduleMotifDetail('')
    setRescheduleShiftWeeks(1)
    setRescheduleCustomDate(rotation.scheduled_date)
    setRescheduleCascadePreview(null)
    setRescheduleStep('form')
    setShowRescheduleModal(true)
  }

  async function handleLoadCascadePreview() {
    setRescheduleCascadePreview(null)
    try {
      const result: any = await loadCascadePreview({
        variables: {
          from_rotation_id: rescheduleTarget.id,
          mode:             rescheduleMode,
          shift_weeks:      rescheduleShiftWeeks,
        },
      })
      if (result?.data?.previewCascade) {
        setRescheduleCascadePreview(result.data.previewCascade)
        setRescheduleStep('preview')
      }
    } catch (e: any) {
      alert(e.message)
    }
  }

  function handleRescheduleSubmit() {
    if (!rescheduleMotif) return alert('Veuillez sélectionner un motif')
    rescheduleRotation({
      variables: {
        id:             rescheduleTarget.id,
        mode:           rescheduleMode,
        shift_weeks:    rescheduleMode === 'CHAIN' ? rescheduleShiftWeeks : undefined,
        scheduled_date: rescheduleMode === 'GAP'  ? rescheduleCustomDate : undefined,
        motif:          rescheduleMotif,
        motif_detail:   rescheduleMotifDetail || undefined,
      },
    })
  }

  function closeRescheduleModal() {
    setShowRescheduleModal(false)
    setRescheduleTarget(null)
    setRescheduleCascadePreview(null)
    setRescheduleStep('form')
  }

  // ── Cancel handlers ───────────────────────────────────────────
  function openCancelModal(rotation: any) {
    setCancelTarget(rotation)
    setCancelMode('HEADQUARTERS')
    setCancelMotif('')
    setCancelMotifDetail('')
    setCancelStep('form')
    setShowCancelModal(true)
  }

  function handleCancelSubmit() {
    if (!cancelMotif) return alert('Veuillez sélectionner un motif')
    cancelRotation({
      variables: {
        id:           cancelTarget.id,
        mode:         cancelMode,
        motif:        cancelMotif,
        motif_detail: cancelMotifDetail || undefined,
      },
    })
  }

  function closeCancelModal() {
    setShowCancelModal(false)
    setCancelTarget(null)
    setCancelStep('form')
  }

  function openSolutionModal(rotation: any) {
    setSolutionRotation(rotation)
    setShowSolutionModal(true)
    loadSolution({ variables: { rotation_id: rotation.id, reason: solutionReason } })
  }

  function openHistoryDrawer(rotation: any) {
    setHistoryRotation(rotation)
    setShowHistoryDrawer(true)
    loadHistory({ variables: { rotation_id: rotation.id } })
  }

  async function handleLoadRebuildPreview() {
    setRebuildPreview(null)
    setRebuildApplied(false)
    try {
      const result: any = await loadRebuildPreview({
        variables: {
          dahira_id: dahiraId,
          from: nextSundayStr(),
          weeks: rebuildWeeks,
          mode: rebuildMode.toUpperCase(),
        },
      })
      if (result?.data?.previewRebuild) {
        setRebuildPreview(result.data.previewRebuild)
      }
    } catch (e: any) {
      alert(e.message)
    }
  }

  function handleApplyRebuild() {
    if (!rebuildPreview) return
    applyRebuild({
      variables: {
        preview: {
          preview: rebuildPreview.preview.map((item: any) => ({
            rotation_id:  item.rotation_id,
            date:         item.date,
            old_member_id:item.old_member_id,
            new_member_id:item.new_member_id,
            old_house_id: item.old_house_id,
            new_house_id: item.new_house_id,
            change_type:  item.change_type,
          })),
          meta: rebuildPreview.meta,
        },
      },
    })
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

  // ─────────────────────────────────────────────────────────────
  //  JSX
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Modal Repousser (enrichi) ────────────────────────────── */}
      {showRescheduleModal && rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl bg-white shadow-xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-orange-500" />
                Repousser le tour
              </h2>
              <button onClick={closeRescheduleModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Done screen */}
            {rescheduleStep === 'done' ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-gray-900">
                    {rescheduleMode === 'HEADQUARTERS' ? 'Tour converti en siège' : 'Planning mis à jour'}
                  </p>
                  {rescheduleCascadePreview && (
                    <p className="text-sm text-gray-500 mt-1">
                      {rescheduleCascadePreview.meta.total_affected} tour(s) déplacé(s)
                    </p>
                  )}
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full" onClick={closeRescheduleModal}>
                  Fermer
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 min-h-0">
                  {/* Rotation info */}
                  <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">Tour concerné</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {rescheduleTarget.member?.full_name ?? 'Sans hôte'} · {formatDate(rescheduleTarget.scheduled_date)}
                    </p>
                    {rescheduleTarget.house && (
                      <p className="text-xs text-gray-400 mt-0.5">🏠 {rescheduleTarget.house.label || rescheduleTarget.house.address}</p>
                    )}
                  </div>

                  {/* Motif */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Motif <span className="text-red-400">*</span>
                    </label>
                    <MotifSelect value={rescheduleMotif} onChange={setRescheduleMotif} />
                    {rescheduleMotif === 'OTHER' && (
                      <input type="text" value={rescheduleMotifDetail}
                        onChange={e => setRescheduleMotifDetail(e.target.value)}
                        placeholder="Précisez..."
                        className="mt-2 h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none" />
                    )}
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comment gérer le planning ?</label>
                    <div className="space-y-2">
                      {RESCHEDULE_MODES.map(m => (
                        <label key={m.value}
                          className={`flex items-start gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-colors ${
                            rescheduleMode === m.value
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}>
                          <input type="radio" name="rescheduleMode" value={m.value}
                            checked={rescheduleMode === m.value}
                            onChange={() => { setRescheduleMode(m.value); setRescheduleCascadePreview(null); setRescheduleStep('form') }}
                            className="mt-0.5 accent-emerald-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{m.icon} {m.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mode-specific params */}
                  {rescheduleMode === 'CHAIN' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nombre de semaines de report
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map(w => (
                          <button key={w} onClick={() => { setRescheduleShiftWeeks(w); setRescheduleCascadePreview(null) }}
                            className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors ${
                              rescheduleShiftWeeks === w
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}>
                            {w}S
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {rescheduleMode === 'GAP' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouvelle date</label>
                      <input type="date" value={rescheduleCustomDate}
                        onChange={e => setRescheduleCustomDate(e.target.value)}
                        min={rescheduleTarget.scheduled_date}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none" />
                    </div>
                  )}

                  {/* Preview (CHAIN or SWAP) */}
                  {(rescheduleMode === 'CHAIN' || rescheduleMode === 'SWAP') && rescheduleStep === 'preview' && rescheduleCascadePreview && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Aperçu des changements
                      </p>
                      <CascadePreviewTable preview={rescheduleCascadePreview} />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-3 border-t border-gray-100 shrink-0 flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={closeRescheduleModal}>
                    Annuler
                  </Button>

                  {(rescheduleMode === 'CHAIN' || rescheduleMode === 'SWAP') && rescheduleStep === 'form' ? (
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={!rescheduleMotif || cascadePreviewLoading}
                      onClick={handleLoadCascadePreview}>
                      {cascadePreviewLoading ? 'Calcul...' : '🔍 Prévisualiser'}
                    </Button>
                  ) : (
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600"
                      disabled={rescheduleLoading || !rescheduleMotif}
                      onClick={handleRescheduleSubmit}>
                      {rescheduleLoading ? 'Enregistrement...' : 'Confirmer'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Annuler ────────────────────────────────────────── */}
      {showCancelModal && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Annuler le tour
              </h2>
              <button onClick={closeCancelModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {cancelStep === 'done' ? (
              <div className="flex flex-col items-center gap-4 px-6 pb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-gray-900">
                    {cancelMode === 'HEADQUARTERS' ? 'Tour converti en siège' : 'Tour annulé'}
                  </p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full" onClick={closeCancelModal}>
                  Fermer
                </Button>
              </div>
            ) : (
              <div className="px-6 pb-6 space-y-4">
                {/* Rotation info */}
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-xs text-red-400 mb-0.5">Tour à annuler</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {cancelTarget.member?.full_name ?? 'Sans hôte'} · {formatDate(cancelTarget.scheduled_date)}
                  </p>
                </div>

                {/* Motif */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Motif <span className="text-red-400">*</span>
                  </label>
                  <MotifSelect value={cancelMotif} onChange={setCancelMotif} />
                  {cancelMotif === 'OTHER' && (
                    <input type="text" value={cancelMotifDetail}
                      onChange={e => setCancelMotifDetail(e.target.value)}
                      placeholder="Précisez..."
                      className="mt-2 h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none" />
                  )}
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Que faire à la place ?</label>
                  <div className="space-y-2">
                    {CANCEL_MODES.map(m => (
                      <label key={m.value}
                        className={`flex items-start gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-colors ${
                          cancelMode === m.value
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}>
                        <input type="radio" name="cancelMode" value={m.value}
                          checked={cancelMode === m.value}
                          onChange={() => setCancelMode(m.value)}
                          className="mt-0.5 accent-red-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{m.icon} {m.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" className="flex-1" onClick={closeCancelModal}>
                    Retour
                  </Button>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    disabled={cancelLoading || !cancelMotif}
                    onClick={handleCancelSubmit}>
                    {cancelLoading ? 'Traitement...' : cancelMode === 'HEADQUARTERS' ? '🏛️ Convertir en siège' : '✕ Confirmer l\'annulation'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Solution intelligente ───────────────────────────── */}
      {showSolutionModal && solutionRotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Solutions intelligentes
                </h2>
                <button onClick={() => setShowSolutionModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Tour du {formatDate(solutionRotation.scheduled_date)} · {solutionRotation.member?.full_name ?? 'Sans hôte'}
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Raison du problème</label>
                <select value={solutionReason}
                  onChange={(e) => { setSolutionReason(e.target.value); loadSolution({ variables: { rotation_id: solutionRotation.id, reason: e.target.value } }) }}
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none">
                  {[['absence','Absence'],['sick','Maladie'],['travel','Voyage'],['death','Décès'],['ramadan','Ramadan / Magal'],['flood','Inondation'],['manual','Autre']].map(([v,l]) =>
                    <option key={v} value={v}>{l}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
              {solutionLoading ? (
                <div className="flex justify-center py-8"><div className="h-7 w-7 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>
              ) : solutions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucune solution disponible</p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const gravity = solutionData?.suggestBestSolution?.gravity
                    return (
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium mb-2 ${gravity === 'high' ? 'bg-red-50 text-red-700' : gravity === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Gravité : {gravity === 'high' ? 'Élevée — recalcul recommandé' : gravity === 'medium' ? 'Moyenne — report possible' : 'Faible — permutation simple'}
                      </div>
                    )
                  })()}
                  {solutions.map((sol: any, i: number) => {
                    const isRec = i === 0
                    const score = Math.round(sol._score ?? 0)
                    return (
                      <div key={sol.type} className={`rounded-xl border p-4 ${isRec ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {isRec && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">Recommandé</span>}
                              <p className="text-sm font-semibold text-gray-900">{sol.label}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-lg font-bold ${score >= 70 ? 'text-emerald-600' : score >= 45 ? 'text-amber-600' : 'text-red-500'}`}>{score}%</div>
                            <button onClick={() => { setApplyingSolution(sol.type); applySolution({ variables: { rotation_id: solutionRotation.id, solution_type: sol.type, meta: JSON.stringify({ reason: solutionReason }) } }) }}
                              disabled={applyingSolution !== null}
                              className="mt-1 rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-40">
                              {applyingSolution === sol.type ? '...' : 'Appliquer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Historique drawer ────────────────────────────────────── */}
      {showHistoryDrawer && historyRotation && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="w-full max-w-sm bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-500" /> Historique
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(historyRotation.scheduled_date)}</p>
              </div>
              <button onClick={() => setShowHistoryDrawer(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {historyLoading ? (
                <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" /></div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-10"><p className="text-sm text-gray-400">Aucune modification enregistrée</p></div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
                  <div className="space-y-4 pl-8">
                    {historyLogs.map((log: any) => {
                      const meta = typeof log.meta === 'string' ? JSON.parse(log.meta) : log.meta
                      const motifLabel = meta?.motif ? MOTIF_OPTIONS.find(m => m.value === meta.motif)?.label : null
                      return (
                        <div key={log.id} className="relative">
                          <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-gray-300 ring-2 ring-white" />
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{ACTION_LABELS[log.action] ?? log.action}</p>
                            {motifLabel && (
                              <span className="inline-block mt-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 px-1.5 py-0.5">
                                {motifLabel}{meta?.motif_detail ? ` — ${meta.motif_detail}` : ''}
                              </span>
                            )}
                            <p className="text-[11px] text-gray-400">{new Date(log.created_at).toLocaleString('fr-FR')}</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">par {log.created_by_name}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Recréer le planning ─────────────────────────────── */}
      {showRebuildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-600" /> Recréer le planning
              </h2>
              <button onClick={() => { setShowRebuildModal(false); setRebuildPreview(null); setRebuildApplied(false) }}
                className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {!rebuildApplied ? (
              <>
                <div className="px-6 pb-4 shrink-0 space-y-4 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Période</label>
                      <select value={rebuildWeeks} onChange={e => { setRebuildWeeks(+e.target.value); setRebuildPreview(null) }}
                        className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none">
                        <option value={4}>4 semaines</option>
                        <option value={8}>8 semaines</option>
                        <option value={12}>12 semaines</option>
                        <option value={26}>6 mois</option>
                        <option value={52}>1 an</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
                      <select value={rebuildMode} onChange={e => { setRebuildMode(e.target.value); setRebuildPreview(null) }}
                        className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none">
                        {REBUILD_MODES.map(m => <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>)}
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleLoadRebuildPreview} disabled={previewLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {previewLoading ? 'Calcul en cours...' : '🔍 Prévisualiser les changements'}
                  </Button>
                </div>
                {rebuildPreview && (
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                    <div className="grid grid-cols-3 gap-3">
                      {[{ label: 'Total', value: rebuildPreview.meta.total_rotations, color: 'text-gray-900' },
                        { label: 'Modifiés', value: rebuildPreview.meta.changed, color: 'text-amber-600' },
                        { label: 'Stabilité', value: `${rebuildPreview.meta.stability_pct}%`, color: 'text-emerald-600' }].map(s =>
                        <div key={s.label} className="rounded-xl border border-gray-100 p-3 text-center">
                          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                      )}
                    </div>
                    {rebuildPreview.locked.length > 0 && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">🔒 {rebuildPreview.locked.length} tour(s) verrouillé(s)</p>
                        {rebuildPreview.locked.map((l: any) => <p key={l.rotation_id} className="text-[11px] text-blue-600">{formatDate(l.date)} — {l.member_name}</p>)}
                      </div>
                    )}
                    <div className="space-y-2">
                      {rebuildPreview.preview.map((item: any) => {
                        const changed = item.change_type !== 'unchanged'
                        return (
                          <div key={item.rotation_id} className={`rounded-xl border px-4 py-3 ${changed ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-gray-600">{formatDate(item.date)}</p>
                              {changed
                                ? <span className="text-[10px] font-medium rounded-full bg-amber-200 text-amber-800 px-2 py-0.5">{item.change_type === 'member_changed' ? 'Membre changé' : 'Maison changée'}</span>
                                : <span className="text-[10px] text-gray-300">Inchangé</span>}
                            </div>
                            {changed && (
                              <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                                <span className="line-through text-red-400">{item.old_member_name ?? '—'}</span>
                                <ArrowLeftRight className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className="text-emerald-600 font-medium">{item.new_member_name ?? '—'}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {rebuildPreview && rebuildPreview.meta.changed > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => { setShowRebuildModal(false); setRebuildPreview(null) }}>Annuler</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={applyingRebuild} onClick={handleApplyRebuild}>
                      {applyingRebuild ? 'Application...' : `✓ Appliquer ${rebuildPreview.meta.changed} changement(s)`}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Planning mis à jour</p>
                  <p className="text-sm text-gray-500 mt-1">{rebuildPreview?.meta?.changed} tour(s) recalculé(s)</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowRebuildModal(false); setRebuildPreview(null); setRebuildApplied(false) }}>
                  Fermer
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Période ────────────────────────────────────────── */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-purple-600" /> Planifier une période
            </h2>
            {!periodResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ</label>
                  <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PERIOD_PRESETS.map((p) => (
                      <button key={p.value} onClick={() => setPeriodPreset(p.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${periodPreset === p.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {periodPreset === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input type="date" value={periodCustomEnd} onChange={(e) => setPeriodCustomEnd(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none" />
                  </div>
                )}
                {getPeriodSundayCount() > 0 && (
                  <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3">
                    <p className="text-sm font-semibold text-purple-800">{getPeriodSundayCount()} dimanches à planifier</p>
                    <p className="text-xs text-purple-600 mt-0.5">jusqu&apos;au {formatDate(getPeriodEndDate())}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowPeriodModal(false)}>Annuler</Button>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={periodLoading || getPeriodSundayCount() === 0} onClick={handlePeriodSubmit}>
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
                    <p className="text-sm font-semibold text-amber-800 mb-2">{periodResult.skipped} dimanche{periodResult.skipped > 1 ? 's' : ''} ignoré{periodResult.skipped > 1 ? 's' : ''}</p>
                    <ul className="space-y-0.5">{periodResult.skippedDates.map((d) => <li key={d} className="text-xs text-amber-700">{formatDate(d)}</li>)}</ul>
                  </div>
                )}
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowPeriodModal(false); setPeriodResult(null) }}>Fermer</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Auto ───────────────────────────────────────────── */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-emerald-600" /> Planification automatique
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du tour</label>
                <input type="date" value={autoDate} onChange={(e) => { setAutoDate(e.target.value); setSuggestedHouse(undefined) }}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <Button onClick={handleAutoSuggest} disabled={suggesting} className="w-full bg-blue-600 hover:bg-blue-700">
                {suggesting ? 'Analyse en cours...' : 'Suggérer la meilleure maison'}
              </Button>
              {suggestedHouse && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
                  <p className="text-sm font-semibold text-emerald-800">Maison recommandée</p>
                  <p className="text-base font-bold text-gray-900">{suggestedHouse.label || suggestedHouse.address}</p>
                  <p className="text-sm text-gray-500">Capacité : {suggestedHouse.capacity} · Passages : {suggestedHouse.total_received ?? 0}</p>
                </div>
              )}
              {suggestedHouse === null && !suggesting && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                  <p className="text-sm font-semibold text-red-700">Aucune maison disponible</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => { setShowAutoModal(false); setSuggestedHouse(undefined) }}>Annuler</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={autoLoading} onClick={handleAutoConfirm}>
                {autoLoading ? 'Création...' : 'Confirmer le tour'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Manuel ─────────────────────────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {manualResult ? (
              /* ── Écran succès ── */
              <div className="flex flex-col items-center justify-center gap-5 px-8 py-12">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                  <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                    <span className="text-[10px] text-white font-bold">✓</span>
                  </div>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-xl font-bold text-gray-900">Tour planifié !</p>
                  {manualResult.replaced && (
                    <p className="text-sm text-amber-600">L'ancien tour a été annulé et remplacé.</p>
                  )}
                  {manualResult.rebuildCount > 0 && (
                    <p className="text-sm text-emerald-600">
                      {manualConflictMode === 'INSERT'
                        ? `${manualResult.rebuildCount} tour(s) décalé(s) pour faire de la place.`
                        : `Planning rééquilibré — ${manualResult.rebuildCount} tour(s) mis à jour.`}
                    </p>
                  )}
                </div>
                <Button className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold" onClick={closeManualModal}>
                  Fermer
                </Button>
              </div>
            ) : (
              <>
                {/* ── En-tête ── */}
                <div className="px-5 pt-5 pb-4 shrink-0">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shrink-0">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 leading-tight">Planification manuelle</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Choisissez la date et le membre hôte</p>
                      </div>
                    </div>
                    <button onClick={closeManualModal}
                      className="shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors mt-0.5">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Date */}
                  <div className="rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Date du tour</label>
                      {manualDateTaken ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="h-2.5 w-2.5" /> Date occupée
                        </span>
                      ) : manualDate ? (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Disponible</span>
                      ) : null}
                    </div>
                    <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                    {manualDate && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                        {new Date(manualDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {/* Recherche membre */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={manualSearch} onChange={e => setManualSearch(e.target.value)}
                      placeholder="Rechercher un membre..."
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none transition-all" />
                    {manualSearch && (
                      <button onClick={() => setManualSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Liste membres ── */}
                <div className="flex-1 overflow-y-auto min-h-0 border-t border-gray-100">
                  {allMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                        <Home className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Aucun membre avec une maison assignée</p>
                      <p className="text-xs text-gray-400 mt-1">Assignez d'abord une maison aux membres</p>
                    </div>
                  ) : (() => {
                    const filtered = manualSearch.trim()
                      ? allMembers.filter((m: any) => m.full_name.toLowerCase().includes(manualSearch.trim().toLowerCase()))
                      : allMembers
                    if (filtered.length === 0) return (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <p className="text-sm text-gray-500">Aucun résultat pour «&nbsp;{manualSearch}&nbsp;»</p>
                      </div>
                    )
                    const AVATAR_COLORS = ['bg-emerald-500','bg-blue-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-teal-500','bg-indigo-500','bg-orange-500']
                    return (
                      <div className="divide-y divide-gray-50 px-2 py-1.5 space-y-0.5">
                        {filtered.map((m: any) => {
                          const isSelected = manualMemberId === m.id
                          const avail = AVAILABILITY_CONFIG[m.availability_status as MemberAvailabilityStatus] ?? AVAILABILITY_CONFIG.available
                          const isUnavailable = m.availability_status !== 'available'
                          const avatarColor = isSelected ? 'bg-emerald-600' : AVATAR_COLORS[m.full_name.charCodeAt(0) % AVATAR_COLORS.length]
                          return (
                            <button key={m.id} onClick={() => setManualMemberId(m.id)}
                              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                                isSelected
                                  ? 'bg-emerald-50 ring-1 ring-emerald-300 shadow-sm'
                                  : 'hover:bg-gray-50'
                              }`}>
                              {/* Avatar */}
                              <div className={`relative h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor}`}>
                                {m.full_name.charAt(0).toUpperCase()}
                                {isSelected && (
                                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
                                    <CheckCircle className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-700' : 'text-gray-900'}`}>
                                    {m.full_name}
                                  </p>
                                  {isUnavailable && (
                                    <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                                      m.availability_status === 'suspended' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${avail.dot}`} />
                                      {avail.label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                  <Home className="h-3 w-3 shrink-0" />
                                  {m.house?.label ?? m.house?.address ?? '—'}
                                </p>
                              </div>

                              {/* Score */}
                              {m.priority_score != null && (
                                <div className={`shrink-0 text-center ${isSelected ? 'opacity-0' : ''}`}>
                                  <p className={`text-sm font-bold leading-none ${m.priority_score >= 7 ? 'text-emerald-600' : m.priority_score >= 4 ? 'text-amber-600' : 'text-gray-400'}`}>
                                    {m.priority_score}
                                  </p>
                                  <p className="text-[9px] text-gray-400 leading-none mt-0.5">score</p>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* ── Footer ── */}
                <div className="px-5 pb-5 pt-3 border-t border-gray-100 shrink-0 space-y-3">

                  {/* Conflit de date */}
                  {manualDateTaken && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                      <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" /> Conflit — un tour existe déjà ce jour
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { value: 'INSERT' as const, label: 'Insérer', desc: 'Décale les suivants +1 sem.', icon: '⬇️' },
                          { value: 'REPLACE' as const, label: 'Remplacer', desc: 'Annule l\'existant', icon: '♻️' },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => setManualConflictMode(opt.value)}
                            className={`flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left border-2 transition-all ${
                              manualConflictMode === opt.value
                                ? 'border-amber-400 bg-white shadow-sm'
                                : 'border-transparent bg-white/60 hover:bg-white'
                            }`}>
                            <span className="text-xs font-bold text-gray-800">{opt.icon} {opt.label}</span>
                            <span className="text-[10px] text-gray-500 leading-tight">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Membre sélectionné */}
                  {manualMemberId && (() => {
                    const m = allMembers.find((x: any) => x.id === manualMemberId)
                    return m ? (
                      <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-800 truncate">{m.full_name}</p>
                          <p className="text-[10px] text-emerald-600 truncate">{m.house?.label ?? m.house?.address}</p>
                        </div>
                        <button onClick={() => setManualMemberId('')}
                          className="text-emerald-400 hover:text-emerald-600 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null
                  })()}

                  {/* Notes */}
                  <input type="text" value={manualNotes} onChange={e => setManualNotes(e.target.value)}
                    placeholder="Notes optionnelles..."
                    className="h-9 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none transition-colors" />

                  {/* Actions */}
                  <div className="flex gap-2.5">
                    <Button variant="ghost" className="flex-1 h-11 rounded-xl" onClick={closeManualModal}>
                      Annuler
                    </Button>
                    <Button className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold"
                      disabled={manualLoading || !manualMemberId}
                      onClick={handleManualSubmit}>
                      {manualLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Création...
                        </span>
                      ) : 'Planifier le tour'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── En-tête ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tours de Dahira</h1>
          <p className="text-sm text-gray-500 mt-1">{total} tours au total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setRebuildPreview(null); setRebuildApplied(false); setShowRebuildModal(true) }}
            variant="ghost" className="flex-1 sm:flex-none border border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <RefreshCw className="h-4 w-4" /> Recréer
          </Button>
          <Button onClick={() => setShowManualModal(true)} variant="ghost" className="flex-1 sm:flex-none border border-gray-300">
            <Plus className="h-4 w-4" /> Manuel
          </Button>
          <Button onClick={() => { setPeriodResult(null); setShowPeriodModal(true) }} variant="ghost"
            className="flex-1 sm:flex-none border border-purple-300 text-purple-700 hover:bg-purple-50">
            <CalendarRange className="h-4 w-4" /> Période
          </Button>
          <Button onClick={() => setShowAutoModal(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Auto-planifier</span>
            <span className="sm:hidden">Auto</span>
          </Button>
        </div>
      </div>

      {/* ── Sous-onglets ─────────────────────────────────────────── */}
      {(() => {
        const TABS = [
          { id: 'passes'   as const, label: 'Passés',   count: pastTours.length,     activeColor: 'bg-gray-700 text-white',   textColor: 'text-gray-500'    },
          { id: 'prochain' as const, label: 'Prochain', count: undefined,             activeColor: 'bg-emerald-600 text-white',textColor: 'text-emerald-600' },
          { id: 'avenir'   as const, label: 'À venir',  count: upcomingTours.length,  activeColor: 'bg-blue-500 text-white',   textColor: 'text-blue-500'    },
        ]
        return (
          <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all ${subTab === t.id ? `${t.activeColor} shadow-sm` : `${t.textColor} hover:bg-white/60`}`}>
                {t.label}
                {t.count !== undefined && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${subTab === t.id ? 'bg-white/25' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        )
      })()}

      {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" /></div>}

      {/* ── Onglet PROCHAIN ──────────────────────────────────────── */}
      {!loading && subTab === 'prochain' && (
        nextTour ? (() => {
          const r = nextTour as any
          const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.planned
          const transitions = STATUS_TRANSITIONS[r.status] ?? []
          const memberAvail = r.member?.availability_status as MemberAvailabilityStatus | undefined
          const availCfg   = memberAvail ? AVAILABILITY_CONFIG[memberAvail] : null
          const daysUntil  = Math.ceil((new Date(r.scheduled_date).getTime() - Date.now()) / 86400000)
          const isToday    = daysUntil === 0
          const isUrgent   = daysUntil <= 3 && daysUntil >= 0

          return (
            <div className={`rounded-2xl border-2 bg-white p-5 shadow-sm space-y-4 ${isToday ? 'border-emerald-400' : isUrgent ? 'border-amber-300' : 'border-emerald-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {isToday && <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">🔥 AUJOURD'HUI</span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className={`text-sm font-semibold ${isToday ? 'text-emerald-600' : isUrgent ? 'text-amber-600' : 'text-gray-400'}`}>
                  {isToday ? 'Aujourd\'hui' : daysUntil > 0 ? `Dans ${daysUntil}j` : `Il y a ${Math.abs(daysUntil)}j`}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 ${r.status === 'headquarters' ? 'bg-purple-600' : 'bg-emerald-600'}`}>
                  {r.status === 'headquarters' ? <Building2 className="h-7 w-7 text-white" />
                    : <span className="text-2xl font-bold text-white">{r.member ? r.member.full_name.charAt(0).toUpperCase() : '?'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-bold text-gray-900">{r.member?.full_name ?? <span className="text-amber-500 text-base">Aucun hôte</span>}</p>
                    {availCfg && memberAvail !== 'available' && (
                      <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${memberAvail === 'suspended' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${availCfg.dot}`} />{availCfg.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-700 font-medium mt-0.5">{formatDate(r.scheduled_date)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">🏠 {r.house?.label || r.house?.address}{r.house?.neighborhood ? ` · ${r.house.neighborhood}` : ''}</p>
                </div>
              </div>
              {r.assignments?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.assignments.map((a: any) => (
                    <span key={a.id} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${a.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.completed ? '✓' : '○'} {a.member?.full_name}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                {['planned','confirmed','rescheduled'].includes(r.status) && (
                  <button onClick={() => openSolutionModal(r)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
                    <Lightbulb className="h-3.5 w-3.5" /> Solution
                  </button>
                )}
                {['planned','confirmed'].includes(r.status) && (
                  <button onClick={() => openRescheduleModal(r)}
                    className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-100 transition-colors">
                    <CalendarClock className="h-3.5 w-3.5" /> Repousser
                  </button>
                )}
                <button onClick={() => openHistoryDrawer(r)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  <History className="h-3.5 w-3.5" /> Historique
                </button>
                {transitions.filter(s => s !== 'cancelled').map((next) => (
                  <button key={next} onClick={() => updateStatus({ variables: { id: r.id, status: next } })}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                    {next === 'confirmed' && <CheckCircle className="h-3.5 w-3.5" />}
                    {next === 'ongoing'   && <Clock className="h-3.5 w-3.5" />}
                    {next === 'completed' && <CheckCircle className="h-3.5 w-3.5" />}
                    {STATUS_CONFIG[next]?.label}
                  </button>
                ))}
                {transitions.includes('cancelled') && (
                  <button onClick={() => openCancelModal(r)}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                    <XCircle className="h-3.5 w-3.5" /> Annuler
                  </button>
                )}
              </div>
            </div>
          )
        })() : (
          <div className="rounded-2xl border-2 border-dashed border-emerald-200 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mx-auto mb-3">
              <RotateCcw className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Aucun tour à venir</p>
            <p className="text-xs text-gray-400 mt-1">Cliquez sur "Auto-planifier" pour créer le prochain tour</p>
          </div>
        )
      )}

      {/* ── Onglet À VENIR ───────────────────────────────────────── */}
      {!loading && subTab === 'avenir' && (
        <div className="space-y-2">
          {upcomingTours.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-blue-100 p-10 text-center">
              <p className="text-sm font-medium text-gray-500">Aucun tour planifié après le prochain</p>
            </div>
          ) : upcomingTours.map((rotation: any) => (
            <RotationRow key={rotation.id} rotation={rotation}
              onSolution={openSolutionModal}
              onReschedule={openRescheduleModal}
              onHistory={openHistoryDrawer}
              onCancel={openCancelModal}
              onStatus={(id, status) => updateStatus({ variables: { id, status } })}
            />
          ))}
        </div>
      )}

      {/* ── Onglet PASSÉS ────────────────────────────────────────── */}
      {!loading && subTab === 'passes' && (
        <div className="space-y-2">
          {pastTours.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-100 p-10 text-center">
              <p className="text-sm font-medium text-gray-500">Aucun tour passé</p>
            </div>
          ) : pastTours.map((rotation: any) => (
            <RotationRow key={rotation.id} rotation={rotation}
              onSolution={openSolutionModal}
              onReschedule={openRescheduleModal}
              onHistory={openHistoryDrawer}
              onCancel={openCancelModal}
              onStatus={(id, status) => updateStatus({ variables: { id, status } })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── RotationRow — compact card ────────────────────────────────
function RotationRow({
  rotation,
  onSolution,
  onReschedule,
  onHistory,
  onCancel,
  onStatus,
}: {
  rotation: any
  onSolution:   (r: any) => void
  onReschedule: (r: any) => void
  onHistory:    (r: any) => void
  onCancel:     (r: any) => void
  onStatus:     (id: string, status: string) => void
}) {
  const cfg         = STATUS_CONFIG[rotation.status] ?? STATUS_CONFIG.planned
  const transitions = (STATUS_TRANSITIONS[rotation.status] ?? []).filter((s: string) => s !== 'cancelled')
  const canCancel   = (STATUS_TRANSITIONS[rotation.status] ?? []).includes('cancelled')
  const memberAvail = rotation.member?.availability_status as MemberAvailabilityStatus | undefined
  const availCfg    = memberAvail ? AVAILABILITY_CONFIG[memberAvail] : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm space-y-2 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 text-white text-sm font-bold ${
          rotation.status === 'headquarters' ? 'bg-purple-500' :
          rotation.status === 'completed'    ? 'bg-gray-400'   :
          rotation.status === 'cancelled'    ? 'bg-red-400'    : 'bg-emerald-600'
        }`}>
          {rotation.status === 'headquarters' ? <Building2 className="h-4 w-4" /> : rotation.member ? rotation.member.full_name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{rotation.member?.full_name ?? <span className="text-amber-500">Aucun hôte</span>}</p>
            {availCfg && memberAvail && memberAvail !== 'available' && (
              <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${memberAvail === 'suspended' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${availCfg.dot}`} />{availCfg.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />{formatDate(rotation.scheduled_date)}
            </p>
            {rotation.house && (
              <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                <Home className="h-3 w-3 shrink-0" />{rotation.house.label || rotation.house.address}
              </p>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50">
        {['planned','confirmed','rescheduled'].includes(rotation.status) && (
          <button onClick={() => onSolution(rotation)}
            className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors">
            <Lightbulb className="h-3 w-3" /> Solution
          </button>
        )}
        {['planned','confirmed'].includes(rotation.status) && (
          <button onClick={() => onReschedule(rotation)}
            className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-600 hover:bg-orange-100 transition-colors">
            <CalendarClock className="h-3 w-3" /> Repousser
          </button>
        )}
        <button onClick={() => onHistory(rotation)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          <History className="h-3 w-3" /> Historique
        </button>
        {transitions.map((next: string) => (
          <button key={next} onClick={() => onStatus(rotation.id, next)}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
            {next === 'confirmed'  && <CheckCircle className="h-3 w-3" />}
            {next === 'ongoing'    && <Clock className="h-3 w-3" />}
            {next === 'completed'  && <CheckCircle className="h-3 w-3" />}
            {STATUS_CONFIG[next]?.label}
          </button>
        ))}
        {canCancel && (
          <button onClick={() => onCancel(rotation)}
            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 transition-colors">
            <XCircle className="h-3 w-3" /> Annuler
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Constants ─────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  status_changed:            'Statut modifié',
  rescheduled:               'Reporté',
  cancelled:                 'Annulé',
  cascade_applied:           'Décalage en cascade',
  converted_to_headquarters: 'Converti en siège',
  rebuild_applied:           'Rebuild appliqué',
  rebuild_cancelled:         'Rebuild annulé',
  availability_updated:      'Disponibilité mise à jour',
  solution_headquarters:     'Solution : Siège',
  solution_swap:             'Solution : Échange',
  solution_postpone:         'Solution : Report',
  solution_volunteer_house:  'Solution : Maison volontaire',
  replaced_by_manual:        'Remplacé manuellement',
}

// ─── Helpers ───────────────────────────────────────────────────
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
  { value: 'custom', label: 'Personnalisé'},
]

function addPeriod(dateStr: string, preset: string): string {
  const d = new Date(dateStr)
  switch (preset) {
    case '1w': break
    case '2w': d.setDate(d.getDate() + 7); break
    case '3w': d.setDate(d.getDate() + 14); break
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
