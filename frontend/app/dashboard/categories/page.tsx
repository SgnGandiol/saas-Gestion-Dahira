'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { GET_MEMBER_CATEGORIES } from '@/graphql/queries/categories'
import { CREATE_MEMBER_CATEGORY, UPDATE_MEMBER_CATEGORY, DELETE_MEMBER_CATEGORY } from '@/graphql/mutations/categories'
import { MemberCategory } from '@/types'

const categorySchema = z.object({
  name: z.string().min(2, 'Nom requis (min. 2 caractères)').max(50),
  label: z.string().min(2, 'Libellé requis').max(100),
  weekly_amount: z.coerce.number().min(0, 'Montant invalide'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale invalide'),
  sort_order: z.coerce.number().int().min(0),
})

type CategoryFormData = z.infer<typeof categorySchema>

const COLOR_PRESETS = [
  { label: 'Vert',   value: '#10b981' },
  { label: 'Ambre',  value: '#f59e0b' },
  { label: 'Gris',   value: '#6b7280' },
  { label: 'Bleu',   value: '#3b82f6' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Rose',   value: '#ec4899' },
]

export default function CategoriesPage() {
  const { user } = useAuthStore()
  const dahiraId = user?.dahira?.id

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<MemberCategory | undefined>(undefined)
  const [formError, setFormError] = useState('')

  const { data, loading, refetch } = useQuery(GET_MEMBER_CATEGORIES, {
    variables: { dahira_id: dahiraId },
    skip: !dahiraId,
  })

  const categories: MemberCategory[] = data?.memberCategories ?? []

  const [createCategory, { loading: createLoading }] = useMutation(CREATE_MEMBER_CATEGORY, {
    onCompleted: () => { refetch(); closeModal() },
    onError: (e) => setFormError(e.graphQLErrors?.[0]?.message ?? 'Erreur création'),
  })

  const [updateCategory, { loading: updateLoading }] = useMutation(UPDATE_MEMBER_CATEGORY, {
    onCompleted: () => { refetch(); closeModal() },
    onError: (e) => setFormError(e.graphQLErrors?.[0]?.message ?? 'Erreur mise à jour'),
  })

  const [deleteCategory, { loading: deleteLoading }] = useMutation(DELETE_MEMBER_CATEGORY, {
    onCompleted: () => refetch(),
    onError: (e) => alert(e.graphQLErrors?.[0]?.message ?? e.message),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: '#10b981', sort_order: 0, weekly_amount: 0 },
  })

  const watchedColor = watch('color')

  function openCreate() {
    setSelected(undefined)
    reset({ color: '#10b981', sort_order: categories.length + 1, weekly_amount: 0 })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEdit(cat: MemberCategory) {
    setSelected(cat)
    reset({
      name: cat.name,
      label: cat.label,
      weekly_amount: cat.weekly_amount,
      color: cat.color,
      sort_order: cat.sort_order,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelected(undefined)
    setFormError('')
  }

  function onSubmit(data: CategoryFormData) {
    setFormError('')
    if (selected) {
      updateCategory({ variables: { id: selected.id, input: { ...data, dahira_id: dahiraId } } })
    } else {
      createCategory({ variables: { input: { ...data, dahira_id: dahiraId } } })
    }
  }

  const isLoading = createLoading || updateLoading

  return (
    <div className="space-y-6">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full sm:max-w-md sm:rounded-lg rounded-t-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selected ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {formError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom interne <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="ex: grand" {...register('name')} disabled={isLoading} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Libellé affiché <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="ex: Grand Membre" {...register('label')} disabled={isLoading} />
                  {errors.label && <p className="mt-1 text-xs text-red-600">{errors.label.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cotisation hebdomadaire (FCFA)
                  </label>
                  <Input type="number" min={0} {...register('weekly_amount')} disabled={isLoading} />
                  {errors.weekly_amount && <p className="mt-1 text-xs text-red-600">{errors.weekly_amount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={watchedColor}
                      onChange={(e) => setValue('color', e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded border border-gray-300"
                    />
                    <Input {...register('color')} disabled={isLoading} className="flex-1" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setValue('color', p.value)}
                        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ borderColor: p.value, color: p.value }}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.value }} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d&apos;affichage</label>
                  <Input type="number" min={0} {...register('sort_order')} disabled={isLoading} />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                  {isLoading ? 'En cours...' : selected ? 'Mettre à jour' : 'Créer la catégorie'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories de membres</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} catégorie{categories.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Aucune catégorie</p>
              <p className="text-sm text-gray-500 mt-1">Créez vos catégories de membres</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...categories].sort((a, b) => a.sort_order - b.sort_order).map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.label.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{cat.label}</p>
                        {cat.is_default && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Par défaut
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <code className="bg-gray-100 rounded px-1">{cat.name}</code>
                        {' · '}
                        {cat.weekly_amount.toLocaleString('fr-SN')} FCFA/semaine
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {!cat.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleteLoading}
                        onClick={() => confirm(`Supprimer "${cat.label}" ?`) && deleteCategory({ variables: { id: cat.id } })}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
