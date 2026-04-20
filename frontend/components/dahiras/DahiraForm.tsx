'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dahira } from '@/types'

const dahiraSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[0-9\s\-]{7,20}$/, 'Téléphone invalide').optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
})

export type DahiraFormData = z.infer<typeof dahiraSchema>

interface DahiraFormProps {
  dahira?: Dahira
  onSubmit: (data: DahiraFormData) => void
  isLoading?: boolean
  error?: string
}

export function DahiraForm({ dahira, onSubmit, isLoading = false, error }: DahiraFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<DahiraFormData>({
    resolver: zodResolver(dahiraSchema),
    defaultValues: dahira
      ? {
          name: dahira.name,
          city: dahira.city || '',
          country: dahira.country || '',
          phone: dahira.phone || '',
          email: dahira.email || '',
          description: (dahira as any).description || '',
          is_active: dahira.is_active,
        }
      : { is_active: true, country: 'Sénégal' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="Dahira Moustarchidina"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
          <Input type="text" placeholder="Dakar" {...register('city')} disabled={isLoading} />
          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
          <Input type="text" placeholder="Sénégal" {...register('country')} disabled={isLoading} />
          {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
          <Input type="tel" placeholder="+221 77 000 00 00" {...register('phone')} disabled={isLoading} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <Input type="email" placeholder="contact@dahira.sn" {...register('email')} disabled={isLoading} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          {...register('description')}
          disabled={isLoading}
          rows={3}
          placeholder="Description de la Dahira..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          disabled={isLoading}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Dahira active
        </label>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? 'En cours...' : dahira ? 'Mettre à jour' : 'Créer la Dahira'}
      </Button>
    </form>
  )
}
