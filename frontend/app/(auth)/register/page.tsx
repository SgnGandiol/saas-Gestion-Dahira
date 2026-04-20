'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { REGISTER_MUTATION } from '@/graphql/mutations/auth'

const schema = z.object({
  name:        z.string().min(2, 'Nom requis'),
  email:       z.string().email('Email invalide'),
  password:    z.string().min(8, 'Minimum 8 caractères'),
  dahira_name: z.string().min(3, 'Nom du Dahira requis'),
  city:        z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const [doRegister, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      setAuth(data.register.token, data.register.user)
      router.push('/dashboard')
    },
    onError: (err) => {
      setServerError(err.graphQLErrors[0]?.message ?? "Erreur lors de l'inscription")
    },
  })

  const onSubmit = (data: FormData) => {
    setServerError('')
    doRegister({ variables: data })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
            <span className="text-2xl font-bold text-white">SGD</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer votre Dahira</h1>
          <p className="mt-1 text-sm text-gray-500">
            Commencez à gérer votre communauté
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="border-b border-gray-100 pb-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Votre compte
              </p>
              <Input
                label="Votre nom complet"
                placeholder="Serigne Modou Ndiaye"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="admin@dahira.sn"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="Min. 8 caractères"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Votre Dahira
              </p>
              <Input
                label="Nom du Dahira"
                placeholder="Dahira Touba Dakar"
                error={errors.dahira_name?.message}
                {...register('dahira_name')}
              />
              <Input
                label="Ville (optionnel)"
                placeholder="Dakar"
                {...register('city')}
              />
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {serverError}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Créer mon Dahira
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
