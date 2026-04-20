'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { DollarSign, TrendingUp, TrendingDown, Plus, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { GET_CONTRIBUTIONS, GET_EXPENSES } from '@/graphql/queries/finance'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { RECORD_CONTRIBUTION, CREATE_EXPENSE } from '@/graphql/mutations/finance'
import { formatDate } from '@/lib/utils'

type TabType = 'contributions' | 'expenses'

const CONTRIBUTION_TYPES = [
  { value: 'cotisation', label: 'Cotisation' },
  { value: 'adiya',      label: 'Adiya' },
  { value: 'don',        label: 'Don' },
  { value: 'autre',      label: 'Autre' },
]

const EXPENSE_CATEGORIES = [
  { value: 'nourriture',    label: 'Nourriture' },
  { value: 'transport',     label: 'Transport' },
  { value: 'materiel',      label: 'Matériel' },
  { value: 'communication', label: 'Communication' },
  { value: 'autre',         label: 'Autre' },
]

const CONTRIBUTION_STATUS = [
  { value: 'paid',    label: 'Payé' },
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partiel' },
]

export default function FinancePage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [tab, setTab]                   = useState<TabType>('contributions')
  const [showContribModal, setShowContribModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  // Contribution form
  const [cMemberId, setCMemberId]   = useState('')
  const [cType, setCType]           = useState('cotisation')
  const [cAmount, setCAmount]       = useState('')
  const [cDate, setCDate]           = useState(todayStr())
  const [cPeriod, setCPeriod]       = useState('')
  const [cStatus, setCStatus]       = useState('paid')
  const [cNotes, setCNotes]         = useState('')

  // Expense form
  const [eLabel, setELabel]         = useState('')
  const [eCategory, setECategory]   = useState('nourriture')
  const [eAmount, setEAmount]       = useState('')
  const [eDate, setEDate]           = useState(todayStr())
  const [eNotes, setENotes]         = useState('')

  const { data: contribData, loading: loadingC, refetch: refetchC } = useQuery(GET_CONTRIBUTIONS, {
    variables: { dahira_id: dahiraId, first: 50, page: 1 },
    skip: !dahiraId,
  })

  const { data: expenseData, loading: loadingE, refetch: refetchE } = useQuery(GET_EXPENSES, {
    variables: { dahira_id: dahiraId, first: 50, page: 1 },
    skip: !dahiraId,
  })

  const { data: membersData } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })

  const [recordContribution, { loading: savingC }] = useMutation(RECORD_CONTRIBUTION, {
    onCompleted: () => { setShowContribModal(false); refetchC() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const [createExpense, { loading: savingE }] = useMutation(CREATE_EXPENSE, {
    onCompleted: () => { setShowExpenseModal(false); refetchE() },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const contributions = contribData?.contributions?.data ?? []
  const expenses      = expenseData?.expenses?.data ?? []
  const members       = membersData?.members?.data ?? []

  const totalContribs  = contributions.reduce((s: number, c: any) => s + c.amount, 0)
  const totalExpenses  = expenses.reduce((s: number, e: any) => s + e.amount, 0)
  const balance        = totalContribs - totalExpenses

  function submitContribution() {
    if (!cMemberId || !cAmount) return alert('Membre et montant obligatoires')
    recordContribution({
      variables: {
        dahira_id: dahiraId, member_id: cMemberId,
        type: cType, amount: parseFloat(cAmount),
        paid_at: cDate, period: cPeriod || undefined,
        status: cStatus, notes: cNotes || undefined,
      },
    })
  }

  function submitExpense() {
    if (!eLabel || !eAmount) return alert('Libellé et montant obligatoires')
    createExpense({
      variables: {
        dahira_id: dahiraId, label: eLabel,
        category: eCategory, amount: parseFloat(eAmount),
        spent_at: eDate, notes: eNotes || undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Modal Contribution */}
      {showContribModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Enregistrer une cotisation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membre <span className="text-red-500">*</span></label>
                <select value={cMemberId} onChange={(e) => setCMemberId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none">
                  <option value="">Sélectionnez...</option>
                  {members.map((m: any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={cType} onChange={(e) => setCType(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none">
                    {CONTRIBUTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select value={cStatus} onChange={(e) => setCStatus(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none">
                    {CONTRIBUTION_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) <span className="text-red-500">*</span></label>
                  <Input type="number" min="0" step="100" value={cAmount} onChange={(e) => setCAmount(e.target.value)} placeholder="5000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <Input type="date" value={cDate} onChange={(e) => setCDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Période (ex: Avril 2026)</label>
                <Input value={cPeriod} onChange={(e) => setCPeriod(e.target.value)} placeholder="Avril 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input value={cNotes} onChange={(e) => setCNotes(e.target.value)} placeholder="Optionnel..." />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowContribModal(false)}>Annuler</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={savingC} onClick={submitContribution}>
                {savingC ? 'En cours...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dépense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Enregistrer une dépense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé <span className="text-red-500">*</span></label>
                <Input value={eLabel} onChange={(e) => setELabel(e.target.value)} placeholder="Achat de thé et café" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select value={eCategory} onChange={(e) => setECategory(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none">
                    {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) <span className="text-red-500">*</span></label>
                  <Input type="number" min="0" step="100" value={eAmount} onChange={(e) => setEAmount(e.target.value)} placeholder="10000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input value={eNotes} onChange={(e) => setENotes(e.target.value)} placeholder="Optionnel..." />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowExpenseModal(false)}>Annuler</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" disabled={savingE} onClick={submitExpense}>
                {savingE ? 'En cours...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Cotisations, dépenses et solde de caisse</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowExpenseModal(true)} variant="ghost" className="flex-1 sm:flex-none border border-red-200 text-red-600 hover:bg-red-50">
            <TrendingDown className="h-4 w-4" />
            Dépense
          </Button>
          <Button onClick={() => setShowContribModal(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Cotisation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total cotisations</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatAmount(totalContribs)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total dépenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatAmount(totalExpenses)}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Solde de caisse</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatAmount(balance)}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <Wallet className={`h-6 w-6 ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {(['contributions', 'expenses'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'contributions' ? `Cotisations (${contributions.length})` : `Dépenses (${expenses.length})`}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {(tab === 'contributions' ? loadingC : loadingE) ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          ) : tab === 'contributions' ? (
            contributions.length === 0 ? (
              <EmptyState icon={<DollarSign />} message="Aucune cotisation enregistrée" />
            ) : (
              <>
              {/* Mobile : cartes */}
              <div className="md:hidden divide-y divide-gray-100">
                {contributions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{c.member?.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.type} · {formatDate(c.paid_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                      <span className="font-semibold text-emerald-600 text-sm">{formatAmount(c.amount)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop : tableau */}
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
                  {contributions.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.member?.full_name}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{c.type}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">{formatAmount(c.amount)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(c.paid_at)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )
          ) : (
            expenses.length === 0 ? (
              <EmptyState icon={<TrendingDown />} message="Aucune dépense enregistrée" />
            ) : (
              <>
              {/* Mobile : cartes */}
              <div className="md:hidden divide-y divide-gray-100">
                {expenses.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{e.label}</p>
                      <p className="text-xs text-gray-500 capitalize">{e.category} · {formatDate(e.spent_at)}</p>
                    </div>
                    <span className="font-semibold text-red-600 text-sm shrink-0 ml-3">{formatAmount(e.amount)}</span>
                  </div>
                ))}
              </div>
              {/* Desktop : tableau */}
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Libellé</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Catégorie</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Montant</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{e.label}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{e.category}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">{formatAmount(e.amount)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(e.spent_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:    'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-blue-100 text-blue-700',
  }
  const label: Record<string, string> = { paid: 'Payé', pending: 'En attente', partial: 'Partiel' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label[status] ?? status}
    </span>
  )
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4 text-gray-400">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-900">{message}</p>
    </div>
  )
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}
