'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Wallet,
  ChevronRight, CheckCircle2, XCircle, Users, RotateCcw,
  BarChart3, Calendar, X, Check, AlertCircle, Search, Clock, Lock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { GET_CONTRIBUTIONS, GET_EXPENSES } from '@/graphql/queries/finance'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { GET_ROTATIONS } from '@/graphql/queries/rotations'
import { GET_EVENTS, GET_EVENT_CONTRIBUTIONS } from '@/graphql/queries/events'
import { RECORD_CONTRIBUTION, CREATE_EXPENSE } from '@/graphql/mutations/finance'
import { UPDATE_ROTATION_STATUS } from '@/graphql/mutations/rotations'
import { CREATE_EVENT, CLOSE_EVENT, DELETE_EVENT, RECORD_EVENT_CONTRIBUTION } from '@/graphql/mutations/events'
import { formatDate } from '@/lib/utils'

type FinanceTab = 'tours' | 'ziar' | 'evenements' | 'social' | 'statistiques'

const TABS: { id: FinanceTab; label: string }[] = [
  { id: 'tours',        label: 'Tours' },
  { id: 'ziar',         label: 'Ziar Annuel' },
  { id: 'evenements',   label: 'Événements' },
  { id: 'social',       label: 'Social' },
  { id: 'statistiques', label: 'Statistiques' },
]

const EXPENSE_CATEGORIES = [
  { value: 'nourriture',    label: 'Nourriture' },
  { value: 'transport',     label: 'Transport' },
  { value: 'materiel',      label: 'Matériel' },
  { value: 'communication', label: 'Communication' },
  { value: 'autre',         label: 'Autre' },
]

export default function FinancePage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [activeTab, setActiveTab]         = useState<FinanceTab>('tours')
  const [selectedRotationId, setSelectedRotationId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId]         = useState<string | null>(null)
  const [showExpenseModal, setShowExpenseModal]       = useState(false)
  const [showContribModal, setShowContribModal]       = useState(false)

  // Expense form
  const [eLabel, setELabel]   = useState('')
  const [eCategory, setECategory] = useState('nourriture')
  const [eAmount, setEAmount] = useState('')
  const [eDate, setEDate]     = useState(todayStr())
  const [eNotes, setENotes]   = useState('')

  // Quick contrib form
  const [cMemberId, setCMemberId] = useState('')
  const [cAmount, setCAmount]     = useState('')
  const [cDate, setCDate]         = useState(todayStr())
  const [cNotes, setCNotes]       = useState('')

  const { data: contribData, loading: loadingC, refetch: refetchC } = useQuery(GET_CONTRIBUTIONS, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })
  const { data: expenseData, loading: loadingE, refetch: refetchE } = useQuery(GET_EXPENSES, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })
  const { data: membersData, loading: loadingMembers } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })
  const { data: rotationsData, refetch: refetchRotations } = useQuery(GET_ROTATIONS, {
    variables: { dahira_id: dahiraId, first: 100, page: 1 },
    skip: !dahiraId,
  })
  const { data: eventsData, refetch: refetchEvents } = useQuery(GET_EVENTS, {
    variables: { dahira_id: dahiraId, first: 100, page: 1 },
    skip: !dahiraId,
  })

  const [recordContribution, { loading: savingC }] = useMutation(RECORD_CONTRIBUTION, {
    onCompleted: () => { refetchC(); setShowContribModal(false) },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })
  const [createExpense, { loading: savingE }] = useMutation(CREATE_EXPENSE, {
    onCompleted: () => { setShowExpenseModal(false); refetchE() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const contributions: any[] = contribData?.contributions?.data ?? []
  const expenses: any[]      = expenseData?.expenses?.data ?? []
  const members: any[]       = membersData?.members?.data ?? []
  const rotations: any[]     = rotationsData?.rotations?.data ?? []
  const events: any[]        = eventsData?.events?.data ?? []

  const selectedEvent = events.find(e => e.id === selectedEventId) ?? null

  const totalContribs = contributions.filter(c => c.status === 'paid' || c.status === 'partial').reduce((s, c) => s + c.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const balance       = totalContribs - totalExpenses

  const selectedRotation = rotations.find(r => r.id === selectedRotationId) ?? null

  function submitExpense() {
    if (!eLabel || !eAmount) return alert('Libellé et montant obligatoires')
    createExpense({ variables: { dahira_id: dahiraId, label: eLabel, category: eCategory, amount: parseFloat(eAmount), spent_at: eDate, notes: eNotes || undefined } })
  }

  function submitContrib() {
    if (!cMemberId || !cAmount) return alert('Membre et montant obligatoires')
    recordContribution({ variables: { dahira_id: dahiraId, member_id: cMemberId, type: 'cotisation', amount: parseFloat(cAmount), paid_at: cDate, period: cDate, status: 'paid', notes: cNotes || undefined } })
  }

  return (
    <div className="space-y-5">
      {/* Modal Dépense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle dépense</h2>
              <button onClick={() => setShowExpenseModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé *</label>
                <Input value={eLabel} onChange={e => setELabel(e.target.value)} placeholder="Achat de thé..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select value={eCategory} onChange={e => setECategory(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none">
                    {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                  <Input type="number" min="0" step="100" value={eAmount} onChange={e => setEAmount(e.target.value)} placeholder="5 000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input type="date" value={eDate} onChange={e => setEDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input value={eNotes} onChange={e => setENotes(e.target.value)} placeholder="Optionnel..." />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowExpenseModal(false)}>Annuler</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" disabled={savingE} onClick={submitExpense}>
                {savingE ? 'En cours...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cotisation rapide */}
      {showContribModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Cotisation manuelle</h2>
              <button onClick={() => setShowContribModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membre *</label>
                <select value={cMemberId} onChange={e => setCMemberId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none">
                  <option value="">Sélectionnez...</option>
                  {members.map((m: any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                  <Input type="number" min="0" step="50" value={cAmount} onChange={e => setCAmount(e.target.value)} placeholder="200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <Input type="date" value={cDate} onChange={e => setCDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input value={cNotes} onChange={e => setCNotes(e.target.value)} placeholder="Optionnel..." />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowContribModal(false)}>Annuler</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={savingC} onClick={submitContrib}>
                {savingC ? 'En cours...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Paiements du Tour */}
      {selectedRotation && (
        <TourPaymentDrawer
          rotation={selectedRotation}
          contributions={contributions}
          rotations={rotations}
          dahiraId={dahiraId ?? ''}
          onClose={() => setSelectedRotationId(null)}
          onSaved={() => { refetchC(); refetchRotations(); setSelectedRotationId(null) }}
          recordContribution={recordContribution}
          savingC={savingC}
        />
      )}

      {/* Drawer Paiements d'Événement */}
      {selectedEvent && (
        <EventPaymentDrawer
          event={selectedEvent}
          dahiraId={dahiraId ?? ''}
          onClose={() => setSelectedEventId(null)}
          onSaved={() => { refetchEvents(); setSelectedEventId(null) }}
        />
      )}

      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cotisations · Dépenses · Ziar Annuel</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowExpenseModal(true)} variant="ghost" className="flex-1 sm:flex-none border border-red-200 text-red-600 hover:bg-red-50 text-sm">
            <TrendingDown className="h-4 w-4" /> Dépense
          </Button>
          <Button onClick={() => setShowContribModal(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-sm">
            <Plus className="h-4 w-4" /> Cotisation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Cotisations" value={totalContribs} color="emerald" icon={<TrendingUp />} />
        <KpiCard label="Dépenses"    value={totalExpenses} color="red"     icon={<TrendingDown />} />
        <KpiCard label="Solde"       value={balance}       color={balance >= 0 ? 'emerald' : 'red'} icon={<Wallet />} />
      </div>

      {/* Onglets */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-max min-w-full sm:w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'tours' && (
        <ToursTab rotations={rotations} contributions={contributions} members={members} onSelect={setSelectedRotationId} />
      )}
      {activeTab === 'ziar' && (
        <ZiarAnnuelTab contributions={contributions} rotations={rotations} />
      )}
      {activeTab === 'evenements' && (
        <EvenementsTab
          events={events}
          dahiraId={dahiraId ?? ''}
          members={members}
          onSelect={setSelectedEventId}
          onRefetch={refetchEvents}
        />
      )}
      {activeTab === 'social' && (
        <SocialTab contributions={contributions} />
      )}
      {activeTab === 'statistiques' && (
        <StatistiquesTab contributions={contributions} members={members} rotations={rotations} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET TOURS
// ─────────────────────────────────────────────────────────────────

type TourSubTab = 'prochaine' | 'planifies' | 'clotures'

function ToursTab({ rotations, contributions, members, onSelect }: {
  rotations: any[]
  contributions: any[]
  members: any[]
  onSelect: (id: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [subTab, setSubTab] = useState<TourSubTab>('prochaine')
  const [showAllClosed, setShowAllClosed] = useState(false)

  const activeMembers = members.filter((m: any) => m.is_active !== false)

  function getTourStats(r: any) {
    const paidIds = new Set(
      contributions
        .filter(c => c.period === r.scheduled_date && (c.status === 'paid' || c.status === 'partial'))
        .map((c: any) => c.member?.id)
    )
    const paidCount      = activeMembers.filter((m: any) => paidIds.has(m.id)).length
    const totalCollected = contributions
      .filter(c => c.period === r.scheduled_date && (c.status === 'paid' || c.status === 'partial'))
      .reduce((s, c) => s + c.amount, 0)
    const totalObjective = activeMembers.reduce((s: number, m: any) => s + (m.category?.weekly_amount ?? 0), 0)
    return { paidCount, totalCount: activeMembers.length, totalCollected, totalObjective }
  }

  function getDaysInfo(dateStr: string) {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    if (diff === 0)  return { label: "Aujourd'hui", isToday: true,  isUrgent: true  }
    if (diff === 1)  return { label: 'Demain',       isToday: false, isUrgent: true  }
    if (diff > 0)    return { label: `Dans ${diff} j`, isToday: false, isUrgent: diff <= 3 }
    if (diff === -1) return { label: 'Hier',          isToday: false, isUrgent: false }
    return { label: `Il y a ${Math.abs(diff)} j`,    isToday: false, isUrgent: false }
  }

  if (rotations.length === 0) {
    return <EmptyState icon={<RotateCcw />} message="Aucun tour planifié" sub="Planifiez des rotations pour commencer" />
  }

  const sorted = [...rotations]
    .filter(r => r.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

  // Clôturés : status 'completed', du plus récent au plus ancien
  const closedTours = sorted.filter(r => r.status === 'completed').reverse()

  // Tours à venir (aujourd'hui ou futur, non clôturés)
  const upcomingAll = sorted.filter(r => {
    const d = new Date(r.scheduled_date); d.setHours(0, 0, 0, 0)
    return r.status !== 'completed' && d >= today
  })
  const nextTour    = upcomingAll[0] ?? null
  const futureTours = upcomingAll.slice(1)

  const visibleClosed = showAllClosed ? closedTours : closedTours.slice(0, 3)

  // ── Sous-onglets
  const SUB_TABS: { id: TourSubTab; label: string; count?: number; color: string; activeColor: string }[] = [
    { id: 'clotures',   label: 'Clôturés',          count: closedTours.length,  color: 'text-gray-500',    activeColor: 'bg-gray-700 text-white'    },
    { id: 'prochaine',  label: 'Prochaine collecte', count: undefined,           color: 'text-emerald-600', activeColor: 'bg-emerald-600 text-white'  },
    { id: 'planifies',  label: 'Planifiés',          count: futureTours.length,  color: 'text-blue-500',    activeColor: 'bg-blue-500 text-white'     },
  ]

  return (
    <div className="space-y-4">

      {/* ── Barre de sous-onglets ── */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 gap-1">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              subTab === t.id
                ? `${t.activeColor} shadow-sm`
                : `${t.color} hover:bg-white/60`
            }`}
          >
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">
              {t.id === 'clotures' ? 'Clôturés' : t.id === 'prochaine' ? 'Collecte' : 'Planifiés'}
            </span>
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                subTab === t.id ? 'bg-white/25' : 'bg-gray-200 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Contenu : PROCHAINE COLLECTE ── */}
      {subTab === 'prochaine' && (
        nextTour ? (() => {
          const hs  = getTourStats(nextTour)
          const hd  = getDaysInfo(nextTour.scheduled_date)
          const pct = hs.totalObjective > 0 ? Math.min(100, (hs.totalCollected / hs.totalObjective) * 100) : 0
          return (
            <div className={`rounded-2xl border-2 bg-white p-5 shadow-sm ${
              hd.isToday ? 'border-emerald-400' : 'border-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {hd.isToday && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                      AUJOURD'HUI
                    </span>
                  )}
                  <RotationStatusBadge status={nextTour.status} />
                </div>
                <span className={`text-sm font-semibold ${
                  hd.isToday ? 'text-emerald-600' : hd.isUrgent ? 'text-amber-600' : 'text-gray-400'
                }`}>{hd.label}</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl shrink-0 ${
                  hd.isToday ? 'bg-emerald-600' : 'bg-emerald-100'
                }`}></div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Tour du {formatDate(nextTour.scheduled_date)}</h3>
                  <p className="text-xs text-gray-500 mt-0.5"> {nextTour.house?.label ?? nextTour.house?.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5"> Membres</p>
                  <p className="text-lg font-bold text-gray-800">{hs.totalCount}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5"> Collecté</p>
                  <p className="text-sm font-bold text-emerald-600 leading-tight">{formatAmount(hs.totalCollected)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5"> Objectif</p>
                  <p className="text-sm font-bold text-gray-700 leading-tight">{formatAmount(hs.totalObjective)}</p>
                </div>
              </div>
              <div className="mb-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{hs.paidCount}/{hs.totalCount} membres payés</span>
                  <span className="font-semibold text-emerald-600">{Math.round(pct)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <button
                onClick={() => onSelect(nextTour.id)}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-colors"
              >
                {hs.paidCount === 0
                  ? '▶ Commencer les cotisations'
                  : hs.paidCount < hs.totalCount
                  ? `Continuer · ${hs.totalCount - hs.paidCount} membres restants`
                  : '✓ Voir le récapitulatif'
                }
              </button>
            </div>
          )
        })() : (
          <div className="rounded-2xl border-2 border-dashed border-emerald-200 p-10 text-center">
            <Calendar className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucun tour à venir</p>
            <p className="text-xs text-gray-400 mt-1">Ajoutez une rotation depuis la page Rotations</p>
          </div>
        )
      )}

      {/* ── Contenu : PLANIFIÉS ── */}
      {subTab === 'planifies' && (
        futureTours.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-blue-200 p-10 text-center">
            <Clock className="h-10 w-10 text-blue-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucun tour planifié</p>
            <p className="text-xs text-gray-400 mt-1">Les tours futurs apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {futureTours.map(r => {
              const s  = getTourStats(r)
              const di = getDaysInfo(r.scheduled_date)
              return (
                <button key={r.id} onClick={() => onSelect(r.id)}
                  className="w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-sm font-semibold text-gray-900 truncate">{formatDate(r.scheduled_date)}</span>
                      <RotationStatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`text-xs font-medium ${di.isUrgent ? 'text-amber-600' : 'text-blue-500'}`}>
                        {di.label}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate"> {r.house?.label ?? r.house?.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5"> {s.totalCount} membres · {formatAmount(s.totalObjective)}</p>
                </button>
              )
            })}
          </div>
        )
      )}

      {/* ── Contenu : CLÔTURÉS ── */}
      {subTab === 'clotures' && (
        closedTours.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucun tour clôturé</p>
            <p className="text-xs text-gray-400 mt-1">Les tours effectués apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleClosed.map(r => {
              const s  = getTourStats(r)
              const di = getDaysInfo(r.scheduled_date)
              const p  = s.totalObjective > 0 ? Math.min(100, (s.totalCollected / s.totalObjective) * 100) : 0
              return (
                <button key={r.id} onClick={() => onSelect(r.id)}
                  className="w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm font-semibold text-gray-600 truncate">{formatDate(r.scheduled_date)}</span>
                      <RotationStatusBadge status={r.status} />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{di.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 truncate pl-5"> {r.house?.label ?? r.house?.address}</p>
                  <div className="flex items-center gap-2 pl-5">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gray-400 transition-all" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{s.paidCount}/{s.totalCount}</span>
                    <span className="text-xs font-semibold text-gray-600 shrink-0">{formatAmount(s.totalCollected)}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  </div>
                </button>
              )
            })}
            {closedTours.length > 3 && (
              <button
                onClick={() => setShowAllClosed(v => !v)}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showAllClosed ? '▲ Réduire' : `▼ Voir ${closedTours.length - 3} tour(s) de plus`}
              </button>
            )}
          </div>
        )
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// LIGNE MEMBRE (drawer cotisation)
// ─────────────────────────────────────────────────────────────────

function MemberRow({ m, color, paid, deferred, isActive, isPayingNow, retard, arrears, activeAmt, savingC, onSelect, onCancel, onAmtChange, onPay, onDefer, onPayAll }: {
  m: any; color: string; paid: boolean; deferred: boolean; isActive: boolean; isPayingNow: boolean
  retard?: number; arrears: number; activeAmt: string; savingC: boolean
  onSelect: () => void; onCancel: () => void; onAmtChange: (v: string) => void; onPay: () => void
  onDefer: () => void; onPayAll: () => void
}) {
  const expectedAmt = m.category?.weekly_amount ?? 200

  if (paid) return (
    <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50/50">
      <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>
        {m.full_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-700 truncate">{m.full_name}</p>
        <p className="text-xs text-emerald-500">{expectedAmt.toLocaleString('fr-FR')} FCFA · Payé</p>
      </div>
      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
    </div>
  )

  // isActive doit être testé avant deferred : le clic sur un membre différé doit ouvrir le formulaire
  if (isActive) return (
    <div className="px-5 py-3 bg-emerald-50 border-l-4 border-emerald-500">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>
          {m.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{m.full_name}</p>
            {retard != null && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">Retard ×{retard}</span>
            )}
            {deferred && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-600">Était différé</span>
            )}
          </div>
          <p className="text-xs text-gray-500">{m.category?.label} · Dû : {expectedAmt.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="h-4 w-4" /></button>
      </div>

      {arrears > 0 && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-red-600">Arriérés</p>
            <p className="text-xs text-red-400">{arrears.toLocaleString('fr-FR')} FCFA en attente</p>
          </div>
          <button
            onClick={onPayAll}
            disabled={savingC}
            className="shrink-0 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            Tout régler · {(expectedAmt + arrears).toLocaleString('fr-FR')} F
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Montant encaissé (FCFA)</label>
          <input
            autoFocus
            type="number"
            value={activeAmt}
            onChange={e => onAmtChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onPay() }}
            className="h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 text-sm font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            min={0} step={50}
          />
        </div>
        <button
          onClick={onPay}
          disabled={isPayingNow || savingC || !activeAmt || parseFloat(activeAmt) <= 0}
          className="mt-5 h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
        >
          {isPayingNow
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <><Check className="h-4 w-4" /> Valider</>
          }
        </button>
        <button
          onClick={onDefer}
          disabled={savingC}
          title="Différer ce membre"
          className="mt-5 h-10 w-10 flex items-center justify-center rounded-lg border border-amber-300 text-amber-500 hover:bg-amber-50 disabled:opacity-50 transition-colors shrink-0"
        >
          <Clock className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  if (deferred) return (
    <button onClick={onSelect} className="w-full flex items-center gap-3 px-5 py-3 bg-amber-50/60 hover:bg-amber-100/60 active:bg-amber-100 transition-colors text-left">
      <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 opacity-70" style={{ backgroundColor: color }}>
        {m.full_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-700 truncate">{m.full_name}</p>
        <p className="text-xs text-amber-500">{expectedAmt.toLocaleString('fr-FR')} FCFA · Différé — appuyez pour encaisser</p>
      </div>
      <Clock className="h-5 w-5 text-amber-400 shrink-0" />
    </button>
  )

  return (
    <button onClick={onSelect} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
      <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>
        {m.full_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
          {retard != null && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">Retard ×{retard}</span>
          )}
          {arrears > 0 && (
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-600">
              Arriérés {arrears.toLocaleString('fr-FR')} F
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{m.category?.label} · {expectedAmt.toLocaleString('fr-FR')} FCFA</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// DRAWER PAIEMENTS DU TOUR
// ─────────────────────────────────────────────────────────────────

function TourPaymentDrawer({ rotation, contributions, rotations, dahiraId, onClose, onSaved, recordContribution, savingC }: {
  rotation: any
  contributions: any[]
  rotations: any[]
  dahiraId: string
  onClose: () => void
  onSaved: () => void
  recordContribution: any
  savingC: boolean
}) {
  const { data: membersData, loading: loadingMembers } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 500, page: 1 },
    fetchPolicy: 'cache-and-network',
    skip: !dahiraId,
  })

  const [updateRotationStatus, { loading: closingTour }] = useMutation(UPDATE_ROTATION_STATUS)

  const allMembers: any[] = useMemo(() =>
    (membersData?.members?.data ?? [])
      .filter((m: any) => m.is_active !== false)
      .sort((a: any, b: any) =>
        (a.category?.sort_order ?? 99) - (b.category?.sort_order ?? 99) ||
        (a.full_name ?? '').localeCompare(b.full_name ?? '')
      ),
    [membersData]
  )

  const paidMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    contributions
      .filter(c => c.period === rotation.scheduled_date && (c.status === 'paid' || c.status === 'partial'))
      .forEach(c => { if (c.member?.id) map[c.member.id] = true })
    return map
  }, [contributions, rotation.scheduled_date])

  // Members deferred for this tour (pending contribution for this period)
  const deferredSet = useMemo(() => new Set(
    contributions
      .filter(c => c.period === rotation.scheduled_date && c.status === 'pending')
      .map((c: any) => c.member?.id)
      .filter(Boolean)
  ), [contributions, rotation.scheduled_date])

  // Past rotation dates (before this tour)
  const pastRotationDates = useMemo(() => new Set(
    rotations
      .filter(r => r.id !== rotation.id && new Date(r.scheduled_date) < new Date(rotation.scheduled_date))
      .map(r => r.scheduled_date)
  ), [rotations, rotation.id, rotation.scheduled_date])

  // Per-member arrears: pending contributions from past periods
  const memberArrearsData = useMemo(() => {
    const map: Record<string, { period: string; amount: number }[]> = {}
    allMembers.forEach((m: any) => {
      const pending = contributions.filter((c: any) =>
        c.member?.id === m.id &&
        c.status === 'pending' &&
        pastRotationDates.has(c.period)
      ).map((c: any) => ({ period: c.period, amount: c.amount }))
      if (pending.length > 0) map[m.id] = pending
    })
    return map
  }, [allMembers, contributions, pastRotationDates])

  const [activeId, setActiveId]     = useState<string | null>(null)
  const [activeAmt, setActiveAmt]   = useState('')
  const [paying, setPaying]         = useState<Record<string, boolean>>({})
  const [localPaid, setLocalPaid]   = useState<Record<string, boolean>>({})
  const [localDeferred, setLocalDeferred] = useState<Record<string, boolean>>({})
  const [search, setSearch]         = useState('')

  const isPaid     = (id: string) => paidMap[id] || localPaid[id]
  const isDeferred = (id: string) => deferredSet.has(id) || localDeferred[id]
  const getArrears = (id: string) => (memberArrearsData[id] ?? []).reduce((s, c) => s + c.amount, 0)

  const paidCount     = allMembers.filter(m => isPaid(m.id)).length
  const deferredCount = allMembers.filter(m => !isPaid(m.id) && isDeferred(m.id)).length
  const totalCount    = allMembers.length

  const totalObjective = allMembers.reduce((s: number, m: any) => s + (m.category?.weekly_amount ?? 0), 0)
  const totalCollected = contributions
    .filter(c => c.period === rotation.scheduled_date && c.status === 'paid')
    .reduce((s, c) => s + c.amount, 0)
  const remaining   = Math.max(0, totalObjective - totalCollected)
  const progressPct = totalObjective > 0 ? Math.min(100, (totalCollected / totalObjective) * 100) : 0

  const recentPastTours = useMemo(() =>
    [...rotations]
      .filter(r => r.id !== rotation.id && (r.status === 'completed' || r.status === 'confirmed'))
      .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
      .slice(0, 4),
    [rotations, rotation.id]
  )

  const memberRetard = useMemo(() => {
    const map: Record<string, number> = {}
    allMembers.forEach((m: any) => {
      const missed = recentPastTours.filter(r =>
        !contributions.some(c =>
          c.period === r.scheduled_date && c.member?.id === m.id &&
          (c.status === 'paid' || c.status === 'partial')
        )
      ).length
      if (missed > 0) map[m.id] = missed
    })
    return map
  }, [allMembers, recentPastTours, contributions])

  const categories = useMemo(() => {
    const groups: { key: string; label: string; color: string; members: any[] }[] = []
    const seen = new Set<string>()
    allMembers.forEach((m: any) => {
      const key = m.category?.name ?? '__none__'
      if (!seen.has(key)) {
        seen.add(key)
        groups.push({ key, label: m.category?.label ?? 'Sans catégorie', color: m.category?.color ?? '#6b7280', members: [] })
      }
      groups.find(g => g.key === key)!.members.push(m)
    })
    return groups
  }, [allMembers])

  const searchTerm   = search.trim().toLowerCase()
  const filteredFlat = searchTerm
    ? allMembers.filter((m: any) => m.full_name.toLowerCase().includes(searchTerm))
    : null

  function selectMember(m: any) {
    setActiveId(m.id)
    setActiveAmt(String(m.category?.weekly_amount ?? 200))
  }

  async function payActive() {
    if (!activeId) return
    const amount = parseFloat(activeAmt)
    if (!amount || amount <= 0) return
    setPaying(p => ({ ...p, [activeId]: true }))
    try {
      await recordContribution({
        variables: {
          dahira_id: dahiraId,
          member_id: activeId,
          type: 'cotisation',
          amount,
          paid_at: rotation.scheduled_date,
          period: rotation.scheduled_date,
          status: 'paid',
        },
      })
      setLocalPaid(p => ({ ...p, [activeId]: true }))
      setActiveId(null)
      setActiveAmt('')
    } finally {
      setPaying(p => ({ ...p, [activeId]: false }))
    }
  }

  async function deferMember(m: any) {
    const expectedAmt = m.category?.weekly_amount ?? 200
    try {
      await recordContribution({
        variables: {
          dahira_id: dahiraId,
          member_id: m.id,
          type: 'cotisation',
          amount: expectedAmt,
          paid_at: rotation.scheduled_date,
          period: rotation.scheduled_date,
          status: 'pending',
        },
      })
      setLocalDeferred(p => ({ ...p, [m.id]: true }))
      setActiveId(null)
    } catch {}
  }

  async function payWithArrears(m: any) {
    const expectedAmt = m.category?.weekly_amount ?? 200
    const currentAmt  = parseFloat(activeAmt) || expectedAmt
    const arrears     = memberArrearsData[m.id] ?? []
    const calls = [
      { period: rotation.scheduled_date, amount: currentAmt },
      ...arrears,
    ]
    setPaying(p => ({ ...p, [m.id]: true }))
    try {
      for (const { period, amount } of calls) {
        await recordContribution({
          variables: {
            dahira_id: dahiraId,
            member_id: m.id,
            type: 'cotisation',
            amount,
            paid_at: rotation.scheduled_date,
            period,
            status: 'paid',
          },
        })
      }
      setLocalPaid(p => ({ ...p, [m.id]: true }))
      setActiveId(null)
      setActiveAmt('')
    } finally {
      setPaying(p => ({ ...p, [m.id]: false }))
    }
  }

  async function closeTour() {
    const unpaidNonDeferred = allMembers.filter(m => !isPaid(m.id) && !isDeferred(m.id))
    const confirmMsg = unpaidNonDeferred.length > 0
      ? `Clôturer ce tour ? ${unpaidNonDeferred.length} membre(s) non payé(s) seront différés automatiquement.`
      : 'Marquer ce tour comme effectué ?'
    if (!window.confirm(confirmMsg)) return

    for (const m of unpaidNonDeferred) {
      const expectedAmt = m.category?.weekly_amount ?? 200
      try {
        await recordContribution({
          variables: {
            dahira_id: dahiraId,
            member_id: m.id,
            type: 'cotisation',
            amount: expectedAmt,
            paid_at: rotation.scheduled_date,
            period: rotation.scheduled_date,
            status: 'pending',
          },
        })
        setLocalDeferred(p => ({ ...p, [m.id]: true }))
      } catch {}
    }

    await updateRotationStatus({ variables: { id: rotation.id, status: 'completed' } })
    onSaved()
  }

  const isBusy = savingC || closingTour
  const canClose = rotation.status !== 'completed' && rotation.status !== 'cancelled'

  function renderMemberRow(m: any, color: string) {
    return (
      <MemberRow
        key={m.id} m={m} color={color}
        paid={isPaid(m.id)}
        deferred={!isPaid(m.id) && isDeferred(m.id)}
        isActive={activeId === m.id}
        isPayingNow={!!paying[m.id]}
        retard={memberRetard[m.id]}
        arrears={getArrears(m.id)}
        activeAmt={activeAmt}
        savingC={isBusy}
        onSelect={() => selectMember(m)}
        onCancel={() => setActiveId(null)}
        onAmtChange={setActiveAmt}
        onPay={payActive}
        onDefer={() => deferMember(m)}
        onPayAll={() => payWithArrears(m)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/40">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-full sm:h-auto max-h-[92vh] w-full sm:max-w-md sm:rounded-l-2xl rounded-t-2xl sm:rounded-tr-none bg-white shadow-2xl flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900">Tour du {formatDate(rotation.scheduled_date)}</h2>
              <p className="text-sm text-gray-500 mt-0.5">🏠 {rotation.house?.label ?? rotation.house?.address}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Objectif / Collecté / Reste */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-xs text-gray-500">Objectif</p>
              <p className="text-sm font-bold text-gray-700">{formatAmount(totalObjective)}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2">
              <p className="text-xs text-gray-500">Collecté</p>
              <p className="text-sm font-bold text-emerald-600">{formatAmount(totalCollected)}</p>
            </div>
            <div className={`rounded-lg p-2 ${remaining > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <p className="text-xs text-gray-500">Reste</p>
              <p className={`text-sm font-bold ${remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatAmount(remaining)}</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {paidCount} payés · {deferredCount} différés · {totalCount - paidCount - deferredCount} en attente
              </span>
              <span>{Math.round(progressPct)}%</span>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        {!loadingMembers && allMembers.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveId(null) }}
                placeholder="Rechercher un membre..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liste membres */}
        <div className="flex-1 overflow-y-auto">
          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          ) : allMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <Users className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Aucun membre dans cette Dahira</p>
              <p className="text-xs text-gray-400 mt-1">Ajoutez des membres depuis la page Membres</p>
            </div>
          ) : filteredFlat ? (
            filteredFlat.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                <Search className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Aucun résultat pour « {search} »</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredFlat.map((m: any) => renderMemberRow(m, m.category?.color ?? '#6b7280'))}
              </div>
            )
          ) : (
            categories.map(cat => (
              <div key={cat.key}>
                <div className="sticky top-0 flex items-center justify-between px-5 py-2 bg-gray-50 border-y border-gray-100 z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-semibold text-gray-600">{cat.label}</span>
                    <span className="text-xs text-gray-400">({cat.members.length})</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {cat.members.filter(m => isPaid(m.id)).length}/{cat.members.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.members.map((m: any) => renderMemberRow(m, cat.color))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 shrink-0 space-y-2">
          {canClose && (
            <button
              onClick={closeTour}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors"
            >
              {closingTour
                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Clôture en cours...</>
                : <><Lock className="h-4 w-4" /> Clôturer la journée · {paidCount}/{totalCount} payés</>
              }
            </button>
          )}
          <Button variant="ghost" className="w-full text-gray-500" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET ZIAR ANNUEL
// ─────────────────────────────────────────────────────────────────

function ZiarAnnuelTab({ contributions, rotations }: { contributions: any[]; rotations: any[] }) {
  const currentYear = new Date().getFullYear()
  const cotisations = contributions.filter(c => c.type === 'cotisation' && c.status === 'paid')
  const totalZiar   = cotisations.reduce((s, c) => s + c.amount, 0)
  const toursEffectues = rotations.filter(r => r.status === 'completed').length
  const membresActifs  = new Set(cotisations.map(c => c.member?.id)).size

  const sorted = [...cotisations].sort((a, b) =>
    new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="" label="Total caisse" value={formatAmount(totalZiar)} color="text-amber-600" />
        <StatCard icon="" label="Tours effectués" value={String(toursEffectues)} color="text-blue-600" />
        <StatCard icon="" label="Membres cotisants" value={String(membresActifs)} color="text-emerald-600" />
        <StatCard icon="" label="En attente" value={String(contributions.filter(c => c.status === 'pending').length)} color="text-red-500" />
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState icon={<DollarSign />} message="Aucune cotisation enregistrée" />
          ) : (
            <>
            <div className="md:hidden divide-y divide-gray-50">
              {sorted.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.member?.full_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(c.paid_at)}</p>
                  </div>
                  <span className="font-semibold text-amber-600 text-sm">{formatAmount(c.amount)}</span>
                </div>
              ))}
            </div>
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Membre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.member?.full_name}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600">{formatAmount(c.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.paid_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.period ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET ÉVÉNEMENTS
// ─────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  thiant: 'Thiant', ziar: 'Ziar', gamou: 'Gamou', social: 'Social', autre: 'Autre',
}
const EVENT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function EvenementsTab({ events, dahiraId, members, onSelect, onRefetch }: {
  events: any[]
  dahiraId: string
  members: any[]
  onSelect: (id: string) => void
  onRefetch: () => void
}) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'active' | 'closed' | 'all'>('active')

  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT, {
    onCompleted: () => { onRefetch(); setShowCreateModal(false) },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })
  const [closeEvent] = useMutation(CLOSE_EVENT, {
    onCompleted: onRefetch,
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    onCompleted: onRefetch,
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const filtered = events.filter(e => filterStatus === 'all' ? true : e.status === filterStatus)
  const activeCount = events.filter(e => e.status === 'active').length
  const closedCount = events.filter(e => e.status === 'closed').length

  function handleClose(ev: any) {
    if (!window.confirm(`Clôturer "${ev.name}" ? Cette action est irréversible.`)) return
    closeEvent({ variables: { id: ev.id } })
  }
  function handleDelete(ev: any) {
    if (!window.confirm(`Supprimer "${ev.name}" définitivement ?`)) return
    deleteEvent({ variables: { id: ev.id } })
  }

  return (
    <div className="space-y-4">
      {/* Modal création */}
      {showCreateModal && (
        <CreateEventModal
          dahiraId={dahiraId}
          members={members}
          onCreate={(input) => createEvent({ variables: { input } })}
          creating={creating}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
          {(['active', 'closed', 'all'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'active' ? `En cours (${activeCount})` : s === 'closed' ? `Clôturés (${closedCount})` : 'Tous'}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-violet-600 hover:bg-violet-700 text-sm">
          <Plus className="h-4 w-4" /> Nouvel événement
        </Button>
      </div>

      {/* Liste des événements */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {filterStatus === 'active' ? 'Aucun événement en cours' : filterStatus === 'closed' ? 'Aucun événement clôturé' : 'Aucun événement'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Créez votre premier événement ci-dessus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => {
            const totalObjective = ev.target_amount ?? 0
            const collected = ev.total_collected ?? 0
            const pct = totalObjective > 0 ? Math.min(100, Math.round((collected / totalObjective) * 100)) : 0
            const reste = Math.max(0, totalObjective - collected)
            const isClosed = ev.status === 'closed'
            return (
              <div key={ev.id} className={`rounded-xl border bg-white overflow-hidden ${isClosed ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'} transition-all`}>
                {/* Bandeau couleur top */}
                <div className="h-1" style={{ backgroundColor: ev.color }} />
                <div className="p-4">
                  {/* Titre + badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                        <h3 className="font-bold text-gray-900 truncate">{ev.name}</h3>
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                          {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                        </span>
                        {isClosed && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-500">Clôturé</span>
                        )}
                      </div>
                      {ev.deadline && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Clôture : {formatDate(ev.deadline)}
                        </p>
                      )}
                    </div>
                    <span className="text-xl font-bold ml-3 shrink-0" style={{ color: ev.color }}>{pct}%</span>
                  </div>

                  {/* Barre de progression */}
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ev.color }} />
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Collecté</p>
                      <p className="text-sm font-bold text-emerald-600">{formatAmount(collected)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Reste</p>
                      <p className={`text-sm font-bold ${reste > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatAmount(reste)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Objectif</p>
                      <p className="text-sm font-bold text-gray-700">{formatAmount(totalObjective)}</p>
                    </div>
                  </div>

                  {/* Montants par catégorie */}
                  {ev.category_amounts?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {ev.category_amounts.map((ca: any) => (
                        <span key={ca.id} className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: ca.category?.color ?? '#6b7280' }} />
                          <span className="text-gray-600">{ca.category?.label}</span>
                          <span className="font-semibold text-gray-800">{formatAmount(ca.amount)}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!isClosed && (
                      <button onClick={() => onSelect(ev.id)}
                        className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: ev.color }}>
                        Gérer les cotisations
                      </button>
                    )}
                    {!isClosed && (
                      <button onClick={() => handleClose(ev)}
                        className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(ev)}
                      className="rounded-lg border border-red-100 px-3 py-2.5 text-xs text-red-400 hover:bg-red-50 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MODAL CRÉATION ÉVÉNEMENT
// ─────────────────────────────────────────────────────────────────

function CreateEventModal({ dahiraId, members, onCreate, creating, onClose }: {
  dahiraId: string
  members: any[]
  onCreate: (input: any) => void
  creating: boolean
  onClose: () => void
}) {
  const [name, setName]           = useState('')
  const [type, setType]           = useState('thiant')
  const [deadline, setDeadline]   = useState('')
  const [color, setColor]         = useState(EVENT_COLORS[0])
  const [description, setDesc]    = useState('')
  const [targetAmount, setTarget] = useState('')

  // Catégories déduites des membres
  const categories = useMemo(() => {
    const seen = new Map<string, any>()
    members.forEach(m => {
      if (m.category && !seen.has(m.category.id)) seen.set(m.category.id, m.category)
    })
    return [...seen.values()]
  }, [members])

  const [catAmounts, setCatAmounts] = useState<Record<string, string>>({})

  function setCatAmount(catId: string, val: string) {
    setCatAmounts(p => ({ ...p, [catId]: val }))
  }

  function submit() {
    if (!name.trim()) return alert('Le nom est obligatoire')
    const category_amounts = categories
      .filter(c => catAmounts[c.id] && parseFloat(catAmounts[c.id]) > 0)
      .map(c => ({ member_category_id: c.id, amount: parseFloat(catAmounts[c.id]) }))

    const totalFromCats = category_amounts.reduce((s, c) => s + c.amount, 0)
    const computedTarget = targetAmount ? parseFloat(targetAmount) : (totalFromCats > 0 ? undefined : undefined)

    onCreate({
      dahira_id: dahiraId,
      name: name.trim(),
      type,
      deadline: deadline || undefined,
      color,
      description: description || undefined,
      target_amount: computedTarget,
      category_amounts,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Nouvel événement</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Thiant du mois de Mouharram..." />
          </div>

          {/* Type + Couleur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-violet-500 focus:outline-none">
                {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {EVENT_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* Date limite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date limite (optionnel)</label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
            <Input value={description} onChange={e => setDesc(e.target.value)} placeholder="Précisions sur l'événement..." />
          </div>

          {/* Montants par catégorie */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant par catégorie (FCFA)</label>
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-32 shrink-0">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-gray-700 truncate">{cat.label}</span>
                    </div>
                    <Input
                      type="number" min="0" step="100"
                      value={catAmounts[cat.id] ?? ''}
                      onChange={e => setCatAmount(cat.id, e.target.value)}
                      placeholder="0"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Laissez 0 pour les catégories non concernées
              </p>
            </div>
          )}

          {/* Objectif global (optionnel si catégories renseignées) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectif global (optionnel)
            </label>
            <Input type="number" min="0" step="1000" value={targetAmount}
              onChange={e => setTarget(e.target.value)} placeholder="Laissez vide pour calculer depuis les catégories" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 text-white" style={{ backgroundColor: color }}
            disabled={creating} onClick={submit}>
            {creating ? 'Création...' : 'Créer l\'événement'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// DRAWER PAIEMENTS D'ÉVÉNEMENT
// ─────────────────────────────────────────────────────────────────

function EventPaymentDrawer({ event, dahiraId, onClose, onSaved }: {
  event: any
  dahiraId: string
  onClose: () => void
  onSaved: () => void
}) {
  const { data: membersData, loading: loadingMembers } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 500, page: 1 },
    fetchPolicy: 'cache-and-network',
    skip: !dahiraId,
  })
  const { data: contribData, loading: loadingContribs, refetch: refetchContribs } = useQuery(GET_EVENT_CONTRIBUTIONS, {
    variables: { dahira_id: dahiraId, event_id: event.id, first: 500, page: 1 },
    fetchPolicy: 'cache-and-network',
    skip: !dahiraId,
  })

  const [recordContrib, { loading: saving }] = useMutation(RECORD_EVENT_CONTRIBUTION, {
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const allMembers: any[] = useMemo(() =>
    (membersData?.members?.data ?? [])
      .filter((m: any) => m.is_active !== false)
      .sort((a: any, b: any) =>
        (a.category?.sort_order ?? 99) - (b.category?.sort_order ?? 99) ||
        (a.full_name ?? '').localeCompare(b.full_name ?? '')
      ),
    [membersData]
  )

  const contributions: any[] = contribData?.contributions?.data ?? []

  // Montant attendu par catégorie pour cet événement
  const catAmountMap = useMemo(() => {
    const map: Record<string, number> = {}
    event.category_amounts?.forEach((ca: any) => {
      map[ca.category?.id] = ca.amount
    })
    return map
  }, [event.category_amounts])

  // Montant déjà payé par membre
  const memberPaidMap = useMemo(() => {
    const map: Record<string, number> = {}
    contributions.forEach((c: any) => {
      if (c.member?.id && (c.status === 'paid' || c.status === 'partial')) {
        map[c.member.id] = (map[c.member.id] ?? 0) + c.amount
      }
    })
    return map
  }, [contributions])

  const [activeId, setActiveId]   = useState<string | null>(null)
  const [activeAmt, setActiveAmt] = useState('')
  const [paying, setPaying]       = useState<Record<string, boolean>>({})
  const [search, setSearch]       = useState('')

  function getExpectedAmt(m: any): number {
    return catAmountMap[m.category?.id] ?? 0
  }
  function getPaidAmt(id: string): number {
    return memberPaidMap[id] ?? 0
  }
  function isFullyPaid(m: any): boolean {
    const expected = getExpectedAmt(m)
    return expected > 0 && getPaidAmt(m.id) >= expected
  }
  function isPartiallyPaid(m: any): boolean {
    return getPaidAmt(m.id) > 0 && !isFullyPaid(m)
  }
  function isNotConcerned(m: any): boolean {
    return getExpectedAmt(m) === 0
  }

  function selectMember(m: any) {
    const remaining = Math.max(0, getExpectedAmt(m) - getPaidAmt(m.id))
    setActiveId(m.id)
    setActiveAmt(String(remaining || getExpectedAmt(m) || 200))
  }

  async function pay() {
    if (!activeId) return
    const amount = parseFloat(activeAmt)
    if (!amount || amount <= 0) return
    const m = allMembers.find(x => x.id === activeId)
    if (!m) return
    const expected = getExpectedAmt(m)
    const alreadyPaid = getPaidAmt(activeId)
    const status = (alreadyPaid + amount) >= expected && expected > 0 ? 'paid' : 'partial'
    setPaying(p => ({ ...p, [activeId]: true }))
    try {
      await recordContrib({
        variables: {
          dahira_id: dahiraId,
          member_id: activeId,
          event_id: event.id,
          amount,
          paid_at: todayStr(),
          status,
        },
      })
      await refetchContribs()
      setActiveId(null)
      setActiveAmt('')
    } finally {
      setPaying(p => ({ ...p, [activeId]: false }))
    }
  }

  const totalObjective = allMembers.reduce((s, m) => s + getExpectedAmt(m), 0)
  const totalCollected = Object.values(memberPaidMap).reduce((s, v) => s + v, 0)
  const paidCount      = allMembers.filter(m => isFullyPaid(m)).length
  const partialCount   = allMembers.filter(m => isPartiallyPaid(m)).length
  const progressPct    = totalObjective > 0 ? Math.min(100, (totalCollected / totalObjective) * 100) : 0

  const searchTerm    = search.trim().toLowerCase()
  const filteredMembers = searchTerm
    ? allMembers.filter((m: any) => m.full_name.toLowerCase().includes(searchTerm))
    : allMembers

  const categories = useMemo(() => {
    const groups: { key: string; label: string; color: string; members: any[] }[] = []
    const seen = new Set<string>()
    allMembers.forEach((m: any) => {
      if (isNotConcerned(m)) return
      const key = m.category?.id ?? '__none__'
      if (!seen.has(key)) {
        seen.add(key)
        groups.push({ key, label: m.category?.label ?? 'Sans catégorie', color: m.category?.color ?? '#6b7280', members: [] })
      }
      groups.find(g => g.key === key)!.members.push(m)
    })
    return groups
  }, [allMembers, catAmountMap])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/40">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex h-full sm:h-auto max-h-[92vh] w-full sm:max-w-md sm:rounded-l-2xl rounded-t-2xl sm:rounded-tr-none bg-white shadow-2xl flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                <h2 className="font-bold text-gray-900">{event.name}</h2>
              </div>
              <p className="text-sm text-gray-500">
                {EVENT_TYPE_LABELS[event.type] ?? event.type}
                {event.deadline ? ` · Clôture ${formatDate(event.deadline)}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-xs text-gray-500">Objectif</p>
              <p className="text-sm font-bold text-gray-700">{formatAmount(totalObjective)}</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: event.color + '20' }}>
              <p className="text-xs text-gray-500">Collecté</p>
              <p className="text-sm font-bold" style={{ color: event.color }}>{formatAmount(totalCollected)}</p>
            </div>
            <div className={`rounded-lg p-2 ${totalCollected >= totalObjective && totalObjective > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-500">Reste</p>
              <p className={`text-sm font-bold ${totalCollected >= totalObjective && totalObjective > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatAmount(Math.max(0, totalObjective - totalCollected))}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: event.color }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{paidCount} payés · {partialCount} partiels · {allMembers.filter(m => !isNotConcerned(m) && !isFullyPaid(m) && !isPartiallyPaid(m)).length} en attente</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setActiveId(null) }}
              placeholder="Rechercher un membre..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm focus:border-violet-400 focus:bg-white focus:outline-none transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"><X className="h-3.5 w-3.5" /></button>}
          </div>
        </div>

        {/* Liste membres */}
        <div className="flex-1 overflow-y-auto">
          {loadingMembers || loadingContribs ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            (searchTerm ? [{ key: 'search', label: 'Résultats', color: '#6b7280', members: filteredMembers.filter(m => !isNotConcerned(m)) }] : categories).map(cat => (
              <div key={cat.key}>
                <div className="sticky top-0 flex items-center justify-between px-5 py-2 bg-gray-50 border-y border-gray-100 z-10">
                  <div className="flex items-center gap-2">
                    {!searchTerm && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />}
                    <span className="text-xs font-semibold text-gray-600">{cat.label}</span>
                    {!searchTerm && <span className="text-xs text-gray-400">({catAmountMap[cat.key] ? formatAmount(catAmountMap[cat.key]) : '—'})</span>}
                  </div>
                  <span className="text-xs text-gray-500">{cat.members.filter(m => isFullyPaid(m)).length}/{cat.members.length}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.members.map((m: any) => {
                    const expected = getExpectedAmt(m)
                    const paid = getPaidAmt(m.id)
                    const remaining = Math.max(0, expected - paid)
                    const fullyPaid = isFullyPaid(m)
                    const partial = isPartiallyPaid(m)
                    const isActive = activeId === m.id

                    if (fullyPaid) return (
                      <div key={m.id} className="flex items-center gap-3 px-5 py-3 bg-emerald-50/50">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: cat.color }}>
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-700 truncate">{m.full_name}</p>
                          <p className="text-xs text-emerald-500">{formatAmount(paid)} · Payé en totalité</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      </div>
                    )

                    if (isActive) return (
                      <div key={m.id} className="px-5 py-3 bg-violet-50 border-l-4 border-violet-500">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: cat.color }}>
                            {m.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{m.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {partial ? `Déjà payé : ${formatAmount(paid)} · Reste : ${formatAmount(remaining)}` : `Dû : ${formatAmount(expected)}`}
                            </p>
                          </div>
                          <button onClick={() => setActiveId(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Montant encaissé (FCFA)</label>
                            <input autoFocus type="number" value={activeAmt}
                              onChange={e => setActiveAmt(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') pay() }}
                              className="h-10 w-full rounded-lg border border-violet-300 bg-white px-3 text-sm font-semibold text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              min={0} step={50} />
                          </div>
                          <button onClick={pay} disabled={paying[m.id] || saving || !activeAmt || parseFloat(activeAmt) <= 0}
                            className="mt-5 h-10 px-4 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                            style={{ backgroundColor: event.color }}>
                            {paying[m.id] ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Check className="h-4 w-4" /> Valider</>}
                          </button>
                        </div>
                      </div>
                    )

                    return (
                      <button key={m.id} onClick={() => selectMember(m)}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${partial ? 'bg-amber-50/60 hover:bg-amber-100/60' : 'hover:bg-gray-50'}`}>
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: cat.color }}>
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${partial ? 'text-amber-700' : 'text-gray-900'}`}>{m.full_name}</p>
                          <p className={`text-xs ${partial ? 'text-amber-500' : 'text-gray-400'}`}>
                            {partial ? `${formatAmount(paid)} versé · reste ${formatAmount(remaining)}` : `Dû : ${formatAmount(expected)}`}
                          </p>
                        </div>
                        {partial ? <Clock className="h-4 w-4 text-amber-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 shrink-0">
          <Button variant="ghost" className="w-full text-gray-500" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET SOCIAL
// ─────────────────────────────────────────────────────────────────

function SocialTab({ contributions }: { contributions: any[] }) {
  const social = contributions.filter(c => c.type === 'adiya' || c.type === 'don')
  const totalSocial = social.reduce((s, c) => s + c.amount, 0)
  const sorted = [...social].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="" label="Caisse sociale" value={formatAmount(totalSocial)} color="text-violet-600" />
        <StatCard icon="" label="Transactions" value={String(social.length)} color="text-violet-500" />
      </div>
      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState icon={<Users />} message="Aucune transaction sociale" sub="Les adiya et dons apparaîtront ici" />
          ) : (
            <>
            <div className="md:hidden divide-y divide-gray-50">
              {sorted.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.member?.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{c.type} · {formatDate(c.paid_at)}</p>
                  </div>
                  <span className="font-semibold text-violet-600 text-sm">{formatAmount(c.amount)}</span>
                </div>
              ))}
            </div>
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Membre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.member?.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{c.type}</td>
                    <td className="px-4 py-3 font-semibold text-violet-600">{formatAmount(c.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(c.paid_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ONGLET STATISTIQUES
// ─────────────────────────────────────────────────────────────────

function StatistiquesTab({ contributions, members, rotations }: {
  contributions: any[]
  members: any[]
  rotations: any[]
}) {
  const paid = contributions.filter(c => c.status === 'paid')

  // Top cotisants
  const memberTotals: Record<string, { name: string; total: number; color?: string }> = {}
  paid.forEach(c => {
    if (!c.member?.id) return
    if (!memberTotals[c.member.id]) {
      memberTotals[c.member.id] = { name: c.member.full_name, total: 0, color: c.member?.category?.color }
    }
    memberTotals[c.member.id].total += c.amount
  })
  const top = Object.values(memberTotals).sort((a, b) => b.total - a.total).slice(0, 5)

  // Taux global de paiement
  const activeMembers = members.filter(m => m.is_active !== false).length
  const payingMembers = new Set(paid.map(c => c.member?.id)).size
  const tauxPaiement  = activeMembers > 0 ? Math.round((payingMembers / activeMembers) * 100) : 0

  // Prévisionnel annuel
  const now         = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weeksElapsed = Math.max(1, Math.round((now.getTime() - startOfYear.getTime()) / (7 * 24 * 3600 * 1000)))
  const thisYearTotal  = paid
    .filter(c => new Date(c.paid_at).getFullYear() === now.getFullYear())
    .reduce((s, c) => s + c.amount, 0)
  const previsionnel = Math.round((thisYearTotal / weeksElapsed) * 52)

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="" label="Taux de paiement" value={`${tauxPaiement}%`} color={tauxPaiement >= 75 ? 'text-emerald-600' : 'text-amber-600'} />
        <StatCard icon="" label="Prévisionnel annuel" value={formatAmount(previsionnel)} color="text-blue-600" />
        <StatCard icon="" label="Membres payants" value={`${payingMembers}/${activeMembers}`} color="text-gray-700" />
        <StatCard icon="" label="Tours complétés" value={String(rotations.filter(r => r.status === 'completed').length)} color="text-emerald-600" />
      </div>

      {/* Top cotisants */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" /> Top cotisants
          </h3>
          {top.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-3">
              {top.map((m, i) => {
                const maxTotal = top[0].total
                const pct = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">#{i + 1}</span>
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: m.color ?? '#6b7280' }}
                        >
                          {m.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{m.name}</span>
                      </div>
                      <span className="font-semibold text-emerald-600">{formatAmount(m.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note IA prédictive */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl"></span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Prévision intelligente</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {previsionnel > 0
                ? `Au rythme actuel, la caisse atteindra ${formatAmount(previsionnel)} d'ici fin ${now.getFullYear()}.`
                : 'Pas assez de données pour générer une prévision.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// COMPOSANTS PARTAGÉS
// ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    red:     'text-red-600 bg-red-50',
  }
  const cls = colorMap[color] ?? `${color} bg-gray-50`
  return (
    <Card>
      <CardContent className="p-3 sm:pt-5 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
            <p className={`text-base sm:text-2xl font-bold mt-0.5 ${cls.split(' ')[0]}`}>
              {formatAmount(value)}
            </p>
          </div>
          <div className={`hidden sm:flex rounded-xl p-3 ${cls.split(' ')[1]}`}>
            <span className={`h-6 w-6 ${cls.split(' ')[0]}`}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function RotationStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    planned:   'bg-blue-100 text-blue-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  }
  const labels: Record<string, string> = {
    planned: 'Planifié', confirmed: 'Confirmé', completed: 'Effectué', cancelled: 'Annulé',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700',
  }
  const labels: Record<string, string> = { paid: 'Payé', pending: 'En attente', partial: 'Partiel' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-3 text-gray-400">{icon}</div>
      <p className="text-sm font-medium text-gray-900">{message}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}
