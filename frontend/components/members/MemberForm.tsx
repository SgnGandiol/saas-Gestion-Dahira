'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Member } from '@/types'

const memberSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().regex(/^\+?[0-9]{7,}$/, 'Téléphone invalide').optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  gender: z.enum(['male', 'female'], { message: 'Sélectionnez un sexe' }),
  profession: z.string().optional().or(z.literal('')),
})

export type MemberFormData = z.infer<typeof memberSchema>

interface MemberFormProps {
  member?: Member
  onSubmit: (data: MemberFormData) => void
  isLoading?: boolean
  error?: string
}

export function MemberForm({ member, onSubmit, isLoading = false, error }: MemberFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member
      ? {
          first_name: member.first_name,
          last_name: member.last_name,
          phone: member.phone || '',
          email: member.email || '',
          gender: member.gender,
          profession: member.profession || '',
        }
      : {},
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prénom <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Jean"
            {...register('first_name')}
            disabled={isLoading}
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Dupont"
            {...register('last_name')}
            disabled={isLoading}
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone
        </label>
        <Input
          type="tel"
          placeholder="+221 77 123 45 67"
          {...register('phone')}
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <Input
          type="email"
          placeholder="jean@example.sn"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Sexe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sexe <span className="text-red-500">*</span>
        </label>
        <select
          {...register('gender')}
          disabled={isLoading}
          className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Sélectionnez...</option>
          <option value="male">Homme</option>
          <option value="female">Femme</option>
        </select>
        {errors.gender && (
          <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>
        )}
      </div>

      {/* Profession */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profession
        </label>
        <Input
          type="text"
          placeholder="Ingénieur, Commerçant, etc."
          {...register('profession')}
          disabled={isLoading}
        />
        {errors.profession && (
          <p className="mt-1 text-xs text-red-600">{errors.profession.message}</p>
        )}
      </div>

      {/* Bouton soumission */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? 'En cours...' : member ? 'Mettre à jour' : 'Ajouter le membre'}
      </Button>
    </form>
  )
}
