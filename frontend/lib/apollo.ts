import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:8080/graphql',
})

// Injecte le token Bearer + headers multi-tenant dans chaque requête
const authLink = setContext((_, { headers }) => {
  if (typeof window === 'undefined') return { headers }

  const token    = localStorage.getItem('sgd_token')
  const tenantId = localStorage.getItem('sgd_tenant_id')

  return {
    headers: {
      ...headers,
      ...(token    ? { Authorization: `Bearer ${token}` }   : {}),
      ...(tenantId ? { 'X-Tenant-ID': tenantId }            : {}),
    },
  }
})

// Gestion globale des erreurs GraphQL
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error] Message: ${message}, Path: ${path}`)
      // Redirige vers login si non authentifié
      if (message === 'Unauthenticated.' && typeof window !== 'undefined') {
        localStorage.removeItem('sgd_token')
        window.location.href = '/login'
      }
    })
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
})
