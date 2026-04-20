'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, ApolloError } from '@apollo/client/react'
import { useApolloClient } from '@apollo/client/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { LOGIN_MUTATION } from '@/graphql/mutations/auth'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})
type FormData = z.infer<typeof schema>

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  dahira: {
    id: string
    name: string
    city: string
  }
}

interface LoginResponse {
  login: {
    token: string
    user: User
  }
}

export default function LoginPage() {
  const router = useRouter()
  const client = useApolloClient()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState('')
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const redirectTo = searchParams?.get('redirect') ?? '/dashboard'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const [login, { loading }] = useMutation<LoginResponse, { email: string; password: string }>(
    LOGIN_MUTATION,
    {
      onCompleted: (data) => {
        // Salva o token e usuário no store
        setAuth(data.login.token, data.login.user)
        
        // Reset Apollo cache para que o novo token seja enviado nas próximas requisições
        client.cache.reset()
        
        setTimeout(() => {
          router.push(redirectTo)
        }, 100)
      },
      onError: (err: ApolloError) => {
        const message = (err as ApolloError).graphQLErrors?.[0]?.message ?? err?.message ?? 'Erreur de connexion'
        setServerError(message)
      },
    }
  )

  const onSubmit = (data: FormData) => {
    setServerError('')
    login({ variables: data })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
            <span className="text-2xl font-bold text-white">SGD</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="mt-1 text-sm text-gray-500">
            Accédez à votre espace Dahira
          </p>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-black">
            <Input
              label="Adresse email"
              type="email"
              placeholder="admin@dahira.sn"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {serverError}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-700">
              Créer un Dahira
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
