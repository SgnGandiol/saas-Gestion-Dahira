'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { ClipboardList, Plus, CheckCircle, Circle, Trash2, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { GET_ROTATIONS } from '@/graphql/queries/rotations'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { CREATE_ASSIGNMENT, TOGGLE_ASSIGNMENT, DELETE_ASSIGNMENT } from '@/graphql/mutations/rotations'
import { formatDate } from '@/lib/utils'

const TASKS = [
  { value: 'lecture_khassaides', label: 'Lecture des Khassaides', icon: '📖' },
  { value: 'accueil',            label: 'Accueil',                icon: '🤝' },
  { value: 'the_cafe',           label: 'Thé & Café',             icon: '☕' },
  { value: 'sonorisation',       label: 'Sonorisation',           icon: '🔊' },
  { value: 'nettoyage',          label: 'Nettoyage',              icon: '🧹' },
  { value: 'caisse',             label: 'Caisse',                 icon: '💰' },
  { value: 'communication',      label: 'Communication',          icon: '📢' },
]

export default function AssignmentsPage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [selectedRotationId, setSelectedRotationId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [modalTask, setModalTask] = useState('')
  const [aMemberId, setAMemberId] = useState('')
  const [aNotes, setANotes]       = useState('')

  const { data: rotationsData } = useQuery(GET_ROTATIONS, {
    variables: { dahira_id: dahiraId, first: 50, page: 1 },
    skip: !dahiraId,
  })

  const { data: membersData } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })

  const [createAssignment, { loading: saving }] = useMutation(CREATE_ASSIGNMENT, {
    onCompleted: () => { setShowModal(false); setAMemberId(''); setANotes('') },
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
    refetchQueries: ['GetRotations'],
  })

  const [toggleAssignment] = useMutation(TOGGLE_ASSIGNMENT, {
    onError: (e) => alert(e.message),
    refetchQueries: ['GetRotations'],
  })

  const [deleteAssignment] = useMutation(DELETE_ASSIGNMENT, {
    onError: (e) => alert(e.message),
    refetchQueries: ['GetRotations'],
  })

  const rotations     = rotationsData?.rotations?.data ?? []
  const allMembers    = membersData?.members?.data ?? []
  const activeRotations = rotations.filter((r: any) => ['planned', 'confirmed'].includes(r.status))
  const selectedRotation = rotations.find((r: any) => r.id === selectedRotationId)

  // Members who live in the rotation's house
  const houseMembers: any[] = selectedRotation?.house?.members ?? []
  const houseMemberIds = new Set(houseMembers.map((m: any) => m.id))

  const assignments: any[] = selectedRotation?.assignments ?? []
  const completedCount = assignments.filter((a: any) => a.completed).length

  function openAssignModal(taskValue: string) {
    setModalTask(taskValue)
    setAMemberId('')
    setANotes('')
    setShowModal(true)
  }

  function submitAssignment() {
    if (!aMemberId) return alert('Sélectionnez un membre')
    createAssignment({
      variables: {
        dahira_id: dahiraId,
        rotation_id: selectedRotationId,
        member_id: aMemberId,
        task: modalTask,
        notes: aNotes || undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Modal assignation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Assigner une tâche</h2>
            <p className="text-sm text-gray-500 mb-5">
              {TASKS.find((t) => t.value === modalTask)?.icon}{' '}
              <span className="font-medium text-gray-700">
                {TASKS.find((t) => t.value === modalTask)?.label}
              </span>
              {' '}— {selectedRotation && formatDate(selectedRotation.scheduled_date)}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membre <span className="text-red-500">*</span>
                </label>

                {/* Membres de la maison hôte en premier */}
                {houseMembers.length > 0 && (
                  <>
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      Membres de la maison hôte
                    </p>
                    <div className="mb-2 space-y-1">
                      {houseMembers.map((m: any) => (
                        <button
                          key={m.id}
                          onClick={() => setAMemberId(m.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            aMemberId === m.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-medium'
                              : 'border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                          }`}
                        >
                          {m.full_name}
                          {m.phone && <span className="ml-2 text-xs text-gray-400">{m.phone}</span>}
                        </button>
                      ))}
                    </div>
                    {allMembers.filter((m: any) => !houseMemberIds.has(m.id)).length > 0 && (
                      <p className="text-xs text-gray-400 mb-1 mt-3">Autres membres</p>
                    )}
                  </>
                )}

                {/* Autres membres */}
                <select
                  value={houseMemberIds.has(aMemberId) ? '' : aMemberId}
                  onChange={(e) => setAMemberId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">
                    {houseMembers.length > 0 ? 'Autre membre...' : 'Sélectionnez un membre...'}
                  </option>
                  {allMembers
                    .filter((m: any) => !houseMemberIds.has(m.id))
                    .map((m: any) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={aNotes}
                  onChange={(e) => setANotes(e.target.value)}
                  placeholder="Optionnel..."
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={saving || !aMemberId}
                onClick={submitAssignment}
              >
                {saving ? 'En cours...' : 'Assigner'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tâches du dimanche</h1>
        <p className="text-sm text-gray-500 mt-1">Assignation des responsabilités par tour</p>
      </div>

      {/* Sélection du tour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner un tour</CardTitle>
        </CardHeader>
        <CardContent>
          {activeRotations.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun tour planifié. Créez d&apos;abord un tour dans le module{' '}
              <strong>Rotations</strong>.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeRotations.map((r: any) => {
                const done  = (r.assignments ?? []).filter((a: any) => a.completed).length
                const total = (r.assignments ?? []).length
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRotationId(r.id)}
                    className={`rounded-xl border px-4 py-2 text-sm text-left transition-colors ${
                      selectedRotationId === r.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{formatDate(r.scheduled_date)}</span>
                    <span className="text-gray-400 mx-1">—</span>
                    <span>{r.house?.label ?? r.house?.address}</span>
                    {total > 0 && (
                      <span className="ml-2 text-xs text-gray-400">({done}/{total})</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détail du tour sélectionné */}
      {selectedRotation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                {formatDate(selectedRotation.scheduled_date)} —{' '}
                {selectedRotation.house?.label ?? selectedRotation.house?.address}
              </CardTitle>
              {assignments.length > 0 && (
                <span className="text-sm text-gray-500">
                  {completedCount}/{assignments.length} effectuée{completedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Membres hôtes */}
            {houseMembers.length > 0 && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  Membres hôtes de cette maison
                </p>
                <div className="flex flex-wrap gap-2">
                  {houseMembers.map((m: any) => (
                    <span
                      key={m.id}
                      className="rounded-full bg-white border border-emerald-200 px-3 py-1 text-sm text-emerald-800"
                    >
                      {m.full_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {houseMembers.length === 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                <p className="text-xs text-amber-700">
                  Aucun membre n&apos;est lié à cette maison. Allez dans{' '}
                  <strong>Membres</strong> pour associer des membres à la maison{' '}
                  <em>{selectedRotation.house?.label ?? selectedRotation.house?.address}</em>.
                </p>
              </div>
            )}

            {/* Barre de progression */}
            {assignments.length > 0 && (
              <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(completedCount / assignments.length) * 100}%` }}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {TASKS.map((task) => {
                const existing = assignments.filter((a: any) => a.task === task.value)
                return (
                  <div key={task.value} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{task.icon}</span>
                        <span className="text-sm font-medium text-gray-800">{task.label}</span>
                        {existing.length === 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">
                            Non assignée
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAssignModal(task.value)}
                        className="h-7 gap-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        <Plus className="h-3 w-3" />
                        Assigner
                      </Button>
                    </div>

                    {existing.length > 0 && (
                      <div className="space-y-1 pl-6 mt-1">
                        {existing.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleAssignment({ variables: { id: a.id } })}
                                title={a.completed ? 'Marquer en attente' : 'Marquer effectuée'}
                              >
                                {a.completed
                                  ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  : <Circle className="h-4 w-4 text-gray-300 hover:text-emerald-400 transition-colors" />
                                }
                              </button>
                              <span className={`text-sm ${a.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {a.member?.full_name}
                                {houseMemberIds.has(a.member?.id) && (
                                  <span className="ml-1.5 text-xs text-emerald-500">🏠</span>
                                )}
                              </span>
                            </div>
                            <button
                              onClick={() => confirm('Supprimer cette assignation ?') && deleteAssignment({ variables: { id: a.id } })}
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedRotationId && activeRotations.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">Sélectionnez un tour ci-dessus</p>
            <p className="text-sm text-gray-500 mt-1">pour voir et gérer ses tâches</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
