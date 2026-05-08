'use client'

import { X, Phone, Mail, Home, Briefcase, Calendar, Star, AlertCircle, Tag } from 'lucide-react'
import { Member, MemberAvailabilityStatus } from '@/types'

const BACKEND = (process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:8081/graphql').replace('/graphql', '')

const AVAILABILITY_CONFIG: Record<MemberAvailabilityStatus, { label: string; dot: string; bg: string; text: string }> = {
  available:   { label: 'Disponible',   dot: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  unavailable: { label: 'Indisponible', dot: 'bg-red-500',     bg: 'bg-red-50',      text: 'text-red-600'     },
  travel:      { label: 'Voyage',       dot: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  sick:        { label: 'Malade',       dot: 'bg-orange-500',  bg: 'bg-orange-50',   text: 'text-orange-700'  },
  suspended:   { label: 'Suspendu',     dot: 'bg-gray-400',    bg: 'bg-gray-100',    text: 'text-gray-500'    },
}

const AVATAR_COLORS = [
  'bg-emerald-500','bg-blue-500','bg-violet-500','bg-amber-500',
  'bg-rose-500','bg-teal-500','bg-indigo-500','bg-orange-500',
]

interface MemberDetailDrawerProps {
  member:  Member | null
  onClose: () => void
  onEdit:  (member: Member) => void
}

function InfoRow({ icon: Icon, label, value, className = '' }: {
  icon: React.ElementType; label: string; value?: string | null; className?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-gray-900 mt-0.5 ${className}`}>{value}</p>
      </div>
    </div>
  )
}

export function MemberDetailDrawer({ member, onClose, onEdit }: MemberDetailDrawerProps) {
  if (!member) return null

  const avail      = AVAILABILITY_CONFIG[member.availability_status] ?? AVAILABILITY_CONFIG.available
  const avatarColor = AVATAR_COLORS[member.first_name.charCodeAt(0) % AVATAR_COLORS.length]
  const photoSrc   = member.photo_url
    ? (member.photo_url.startsWith('http') ? member.photo_url : BACKEND + member.photo_url)
    : null

  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const priorityLabel =
    member.priority_score >= 80 ? 'Très haute' :
    member.priority_score >= 60 ? 'Haute' :
    member.priority_score >= 40 ? 'Moyenne' : 'Basse'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden text-white font-bold text-xl ${photoSrc ? '' : avatarColor}`}>
                {photoSrc
                  ? <img src={photoSrc} alt={member.full_name} className="h-full w-full object-cover" />
                  : member.first_name.charAt(0).toUpperCase()
                }
                <span className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${avail.dot}`} />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{member.full_name}</h2>
                {member.category && (
                  <span className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: member.category.color }}>
                    {member.category.label}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${avail.bg} ${avail.text}`}>
              <span className={`h-2 w-2 rounded-full ${avail.dot}`} />
              {avail.label}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {member.is_active ? 'Actif' : 'Inactif'}
            </span>
            {member.gender && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {member.gender === 'male' ? 'Homme' : 'Femme'}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">

          {/* Contact */}
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact</p>
          <div className="rounded-2xl bg-gray-50 px-4 py-1 divide-y divide-gray-100">
            <InfoRow icon={Phone}    label="Téléphone" value={member.phone} />
            <InfoRow icon={Mail}     label="Email"     value={member.email} />
          </div>

          {/* Infos générales */}
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">Informations</p>
          <div className="rounded-2xl bg-gray-50 px-4 py-1 divide-y divide-gray-100">
            <InfoRow icon={Briefcase} label="Profession"    value={member.profession} />
            <InfoRow icon={Calendar}  label="Membre depuis" value={joinedDate} />
            {member.house && (
              <InfoRow
                icon={Home}
                label="Maison d'accueil"
                value={member.house.label ? `${member.house.label} — ${member.house.address}` : member.house.address}
              />
            )}
            {!member.house && (
              <div className="flex items-start gap-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 shrink-0 mt-0.5">
                  <Home className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Maison</p>
                  <p className="text-sm text-amber-600 font-medium mt-0.5">Aucune maison assignée</p>
                </div>
              </div>
            )}
            {member.category && (
              <InfoRow
                icon={Tag}
                label="Catégorie"
                value={`${member.category.label} — ${member.category.weekly_amount.toLocaleString('fr-SN')} FCFA/sem.`}
              />
            )}
          </div>

          {/* Scores */}
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">Statistiques</p>
          <div className="rounded-2xl bg-gray-50 px-4 py-3 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-gray-600">Score de priorité</span>
                </div>
                <span className="text-xs font-bold text-gray-800">{member.priority_score} — {priorityLabel}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                  style={{ width: `${Math.min(member.priority_score, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-semibold text-gray-600">Fréquence d'absence</span>
              </div>
              <span className={`text-xs font-bold ${
                member.absence_frequency > 3 ? 'text-red-600' :
                member.absence_frequency > 1 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {member.absence_frequency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => { onClose(); onEdit(member) }}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            Modifier le membre
          </button>
        </div>
      </div>
    </>
  )
}
