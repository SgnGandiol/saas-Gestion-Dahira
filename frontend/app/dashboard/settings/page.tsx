'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { Settings, Users, Building2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'
import { GET_ME } from '@/graphql/queries/dashboard'
import { GET_MEMBERS } from '@/graphql/queries/members'
import { formatDate } from '@/lib/utils'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin:   { label: 'Super Admin',   color: 'bg-purple-100 text-purple-700' },
  admin:         { label: 'Administrateur', color: 'bg-blue-100 text-blue-700' },
  tresorier:     { label: 'Trésorier',      color: 'bg-amber-100 text-amber-700' },
  secretaire:    { label: 'Secrétaire',     color: 'bg-teal-100 text-teal-700' },
  organisateur:  { label: 'Organisateur',   color: 'bg-indigo-100 text-indigo-700' },
  membre:        { label: 'Membre',         color: 'bg-gray-100 text-gray-600' },
}

export default function SettingsPage() {
  const { user: storeUser } = useAuthStore()
  const dahiraId = storeUser?.dahira?.id

  const { data: meData }      = useQuery(GET_ME)
  const { data: membersData } = useQuery(GET_MEMBERS, {
    variables: { dahira_id: dahiraId, first: 200, page: 1 },
    skip: !dahiraId,
  })

  const me      = meData?.me ?? storeUser
  const dahira  = me?.dahira
  const members = membersData?.members?.data ?? []

  const usersWithRoles = members.filter((m: any) => m.user)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration du Dahira et de l'équipe dirigeante</p>
      </div>

      {/* Profil Dahira */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Profil du Dahira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Nom" value={dahira?.name} />
            <InfoRow label="Slug" value={dahira?.slug} mono />
            <InfoRow label="Ville" value={dahira?.city} />
            <InfoRow label="Pays" value={dahira?.country} />
            <InfoRow label="Téléphone" value={dahira?.phone} />
            <InfoRow label="Email" value={dahira?.email} />
            <InfoRow label="Statut" value={dahira?.is_active ? 'Actif' : 'Inactif'} />
          </div>
        </CardContent>
      </Card>

      {/* Mon profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Mon profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Nom" value={me?.name} />
            <InfoRow label="Email" value={me?.email} />
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Rôles</p>
              <div className="flex flex-wrap gap-1.5">
                {(me?.roles ?? []).map((role: string) => {
                  const cfg = ROLE_LABELS[role] ?? { label: role, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <span key={role} className={`rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membres avec accès */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Équipe dirigeante
            <span className="ml-auto text-sm font-normal text-gray-400">{usersWithRoles.length} compte(s)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersWithRoles.length === 0 ? (
            <p className="text-sm text-gray-500">
              Les membres avec un compte utilisateur apparaîtront ici.
            </p>
          ) : (
            <div className="space-y-2">
              {usersWithRoles.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.full_name}</p>
                    <p className="text-xs text-gray-500">{m.user?.email}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {(m.user?.roles ?? []).map((role: string) => {
                      const cfg = ROLE_LABELS[role] ?? { label: role, color: 'bg-gray-100 text-gray-600' }
                      return (
                        <span key={role} className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version */}
      <div className="text-center text-xs text-gray-400 pt-4">
        SGD v1.0 · Laravel 12 · Next.js 16 · GraphQL
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-0.5 text-sm text-gray-900 ${mono ? 'font-mono' : ''}`}>
        {value ?? <span className="text-gray-400">—</span>}
      </p>
    </div>
  )
}
