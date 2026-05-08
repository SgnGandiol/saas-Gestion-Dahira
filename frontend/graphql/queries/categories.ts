import { gql } from '@apollo/client'

export const GET_MEMBER_CATEGORIES = gql`
  query GetMemberCategories($dahira_id: ID!) {
    memberCategories(dahira_id: $dahira_id) {
      id
      name
      label
      weekly_amount
      color
      is_default
      sort_order
    }
  }
`
