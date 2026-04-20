import { gql } from '@apollo/client/core'

export const GET_DAHIRAS = gql`
  query GetDahiras {
    dahiras {
      id
      name
      slug
      city
      country
      phone
      email
      description
      is_active
      created_at
    }
  }
`
