'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { ClipboardList, Plus, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { GET_ROTATIONS } from '@/graphql/queries/rotations'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { CREATE_ASSIGNMENT } from '@/graphql/mutations/rotations'
import { formatDate } from '@/lib/utils'

const TASKS = [
  { value: 'lecture_khassaides', label: 'Lecture des Khassaides' },
  { value: 'accueil',            label: 'Accueil' },
  { value: 'the_cafe',           label: 'Thé & Café' },
  { value: 'sonorisation',       label: 'Sonorisation' },
  { value: 'nettoyage',          label: 'Nettoyage' },
  { value: 'caisse',             label: 'Caisse' },
  { value: 'communication',      label: 'Communication' },
]

export default function AssignmentsPage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [selectedRotationId, setSelectedRotationId] = useState<string>('')
  const [showModal, setShowModal]                   = useState(false)
  const [aMemberId, setAMemberId]                   = useState('')
  const [aTask, setATask]                           = useState('accueil')
  const [aNotes, setANotes]                         = useState('')

  const { data: rotationsData } = useQuery(GET_ROTATIONS, {
    variables: { dahira_id: dahiraId, first: 20, page: 1 },
    skip: !dahiraId,
  })

  const { data: membersData } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })

  const [createAssignment, { loading: saving }] = useMutation(CREATE_ASSIGNMENT, {
    onCompleted: () => { setShowModal(false); setAMemberId(''); setATask('accueil'); setANotes('') },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
    refetchQueries: ['GetRotations'],
  })

  const rotations = rotationsData?.rotations?.data ?? []
  const members   = membersData?.members?.data ?? []

  const activeRotations = rotations.filter((r: any) => ['planned', 'confirmed'].includes(r.status))
  const selectedRotation = rotations.find((r: any) => r.id === selectedRotationId)

  function submitAssignment() {
    if (!aMemberId || !selectedRotationId) return alert('Sélectionnez un membre et un tour')
    createAssignment({
      variables: {
        dahira_id: dahiraId,
        rotation_id: selectedRotationId,
        member_id: aMemberId,
        task: aTask,
        notes: aNotes || undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Assigner une tâche</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tour <span className="text-red-500">*</span></label>
                <select value={selectedRotationId} onChange={(e) => setSelectedRotationId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none">
                  <option value="">Sélectionnez un tour...</option>
                  {activeRotations.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {formatDate(r.scheduled_date)} — {r.house?.family?.name ?? r.house?.address}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membre <span className="text-red-500">*</span></label>
                <select value={aMemberId} onChange={(e) => setAMemberId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none">
                  <option value="">Sélectionnez un membre...</option>
                  {members.map((m: any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tâche</label>
                <select value={aTask} onChange={(e) => setATask(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none">
                  {TASKS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={aNotes}
                  onChange={(e) => setANotes(e.target.value)}
                  placeholder="Optionnel..."
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={submitAssignment}>
                {saving ? 'En cours...' : 'Assigner'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tâches du dimanche</h1>
          <p className="text-sm text-gray-500 mt-1">Assignation des responsabilités par tour</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Assigner une tâche
        </Button>
      </div>

      {/* Sélection du tour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner un tour</CardTitle>
        </CardHeader>
        <CardContent>
          {activeRotations.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun tour planifié ou confirmé. Créez d'abord un tour dans le module <strong>Rotations</strong>.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeRotations.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRotationId(r.id)}
                  className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                    selectedRotationId === r.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {formatDate(r.scheduled_date)} — {r.house?.family?.name ?? r.house?.address}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignations du tour sélectionné */}
      {selectedRotation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              Tâches — {formatDate(selectedRotation.scheduled_date)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRotation.assignments?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Aucune tâche assignée pour ce tour.</p>
                <Button onClick={() => setShowModal(true)} className="mt-3 bg-emerald-600 hover:bg-emerald-700" size="sm">
                  <Plus className="h-4 w-4" />
                  Assigner
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedRotation.assignments.map((a: any) => {
                  const taskLabel = TASKS.find((t) => t.value === a.task)?.label ?? a.task
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          a.completed ? 'bg-emerald-100' : 'bg-gray-200'
                        }`}>
                          <CheckCircle className={`h-4 w-4 ${a.completed ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{taskLabel}</p>
                          <p className="text-xs text-gray-500">{a.member?.full_name}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        a.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {a.completed ? 'Effectué' : 'En attente'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vue d'ensemble toutes tâches */}
      {!selectedRotationId && rotations.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">Sélectionnez un tour ci-dessus</p>
            <p className="text-sm text-gray-500 mt-1">pour voir et gérer ses tâches assignées</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
