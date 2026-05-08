'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Camera } from 'lucide-react'
import { Member, House, MemberCategory } from '@/types'

const memberSchema = z.object({
  first_name:         z.string().min(2, 'Au moins 2 caractères'),
  last_name:          z.string().min(2, 'Au moins 2 caractères'),
  phone:              z.string().regex(/^\+?[0-9]{7,}$/, 'Téléphone invalide').optional().or(z.literal('')),
  email:              z.string().email('Email invalide').optional().or(z.literal('')),
  gender:             z.enum(['male', 'female'], { message: 'Sélectionnez un genre' }),
  profession:         z.string().optional().or(z.literal('')),
  member_category_id: z.string().optional().or(z.literal('')),
})

export type MemberFormData = z.infer<typeof memberSchema> & { house_id?: string }

interface MemberFormProps {
  member?:        Member
  houses?:        House[]
  categories?:    MemberCategory[]
  houseId:        string
  photoPreview?:  string       // object-URL or backend URL for current photo
  onHouseChange:  (id: string) => void
  onCreateHouse:  () => void
  onPhotoClick:   () => void   // triggers file picker in parent
  onSubmit:       (data: MemberFormData) => void
  isLoading?:     boolean
  error?:         string
}

const AVATAR_COLORS = [
  'bg-emerald-500','bg-blue-500','bg-violet-500','bg-amber-500',
  'bg-rose-500','bg-teal-500','bg-indigo-500','bg-orange-500',
]

export function MemberForm({
  member, houses = [], categories = [],
  houseId, photoPreview, onHouseChange, onCreateHouse, onPhotoClick,
  onSubmit, isLoading = false, error,
}: MemberFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member ? {
      first_name:         member.first_name,
      last_name:          member.last_name,
      phone:              member.phone    || '',
      email:              member.email    || '',
      gender:             member.gender,
      profession:         member.profession || '',
      member_category_id: member.category?.id || '',
    } : {},
  })

  const selectedGender = watch('gender')
  const nameInitial    = (member?.first_name ?? '?').charAt(0).toUpperCase()
  const avatarColor    = member
    ? AVATAR_COLORS[member.first_name.charCodeAt(0) % AVATAR_COLORS.length]
    : 'bg-emerald-500'

  const handleFormSubmit = (data: MemberFormData) => {
    onSubmit({ ...data, house_id: houseId || undefined })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Photo avatar ── */}
      <div className="flex flex-col items-center gap-2 pb-2">
        <button type="button" onClick={onPhotoClick} disabled={isLoading}
          className="relative group cursor-pointer disabled:cursor-not-allowed">
          {/* Circle */}
          <div className={`h-24 w-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex items-center justify-center ${photoPreview ? '' : avatarColor}`}>
            {photoPreview ? (
              <img src={photoPreview} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{nameInitial}</span>
            )}
          </div>
          {/* Camera overlay */}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-7 w-7 text-white" />
          </div>
          {/* Badge */}
          <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-white shadow">
            <Camera className="h-3.5 w-3.5 text-white" />
          </div>
        </button>
        <p className="text-xs text-gray-400">
          {photoPreview ? 'Cliquer pour changer' : 'Ajouter une photo'}
        </p>
      </div>

      {/* ── Prénom / Nom ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Prénom <span className="text-red-400 normal-case font-normal">*</span>
          </label>
          <input type="text" placeholder="Baye"
            {...register('first_name')} disabled={isLoading}
            className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none transition-colors disabled:bg-gray-50" />
          {errors.first_name && <p className="mt-1 text-[11px] text-red-500">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Nom <span className="text-red-400 normal-case font-normal">*</span>
          </label>
          <input type="text" placeholder="Guene"
            {...register('last_name')} disabled={isLoading}
            className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none transition-colors disabled:bg-gray-50" />
          {errors.last_name && <p className="mt-1 text-[11px] text-red-500">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* ── Genre ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Genre <span className="text-red-400 normal-case font-normal">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'male',   label: 'Homme' },
            { value: 'female', label: 'Femme' },
          ] as const).map(opt => (
            <label key={opt.value}
              className={`flex items-center justify-center h-10 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium select-none ${
                selectedGender === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input type="radio" value={opt.value} {...register('gender')} disabled={isLoading} className="sr-only" />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.gender && <p className="mt-1 text-[11px] text-red-500">{errors.gender.message}</p>}
      </div>

      {/* ── Téléphone / Email ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone</label>
          <input type="tel" placeholder="+221 77 000 00 00"
            {...register('phone')} disabled={isLoading}
            className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none transition-colors disabled:bg-gray-50" />
          {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
          <input type="email" placeholder="nom@exemple.sn"
            {...register('email')} disabled={isLoading}
            className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none transition-colors disabled:bg-gray-50" />
          {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      {/* ── Catégorie ── */}
      {categories.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Catégorie</label>
          <select {...register('member_category_id')} disabled={isLoading}
            className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors bg-white disabled:bg-gray-50">
            <option value="">— Aucune catégorie —</option>
            {[...categories].sort((a, b) => a.sort_order - b.sort_order).map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label} — {cat.weekly_amount.toLocaleString('fr-SN')} FCFA/sem.
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Maison ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maison d'accueil</label>
          <button type="button" onClick={onCreateHouse} disabled={isLoading}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> Nouvelle maison
          </button>
        </div>
        <select value={houseId} onChange={e => onHouseChange(e.target.value)} disabled={isLoading}
          className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors bg-white disabled:bg-gray-50">
          <option value="">— Aucune maison —</option>
          {houses.map(h => (
            <option key={h.id} value={h.id}>
              {h.label ? `${h.label} — ${h.address}` : h.address}
            </option>
          ))}
        </select>
      </div>

      {/* ── Profession ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Profession</label>
        <input type="text" placeholder="Ingénieur, Commerçant, Enseignant..."
          {...register('profession')} disabled={isLoading}
          className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none transition-colors disabled:bg-gray-50" />
      </div>

      <button type="submit" disabled={isLoading}
        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
        {isLoading ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> En cours...</>
        ) : member ? 'Mettre à jour le membre' : 'Ajouter le membre'}
      </button>
    </form>
  )
}
