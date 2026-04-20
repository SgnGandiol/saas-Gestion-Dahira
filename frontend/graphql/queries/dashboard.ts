import { gql } from '@apollo/client/core'

export const GET_ME = gql`
  query Me {
    me {
      id
      name
      email
      roles
      dahira {
        id
        name
        city
        country
        phone
        email
        slug
        is_active
      }
    }
  }
`

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($dahira_id: ID!) {
    dashboardStats(dahira_id: $dahira_id) {
      active_members_count
      families_count
      monthly_contributions
      monthly_expenses
      balance
      next_rotation {
        id
        scheduled_date
        status
        house {
          id
          label
          address
          family {
            id
            name
          }
        }
      }
    }
  }
`
