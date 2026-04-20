import { gql } from '@apollo/client/core'

export const GET_ROTATIONS = gql`
  query GetRotations($dahira_id: ID!, $status: RotationStatus, $first: Int, $page: Int) {
    rotations(dahira_id: $dahira_id, status: $status, first: $first, page: $page) {
      data {
        id
        scheduled_date
        status
        attendees_count
        notes
        house {
          id
          label
          address
          neighborhood
          capacity
          family {
            id
            name
          }
        }
        assignments {
          id
          task
          completed
          member {
            id
            full_name
          }
        }
      }
      paginatorInfo {
        total
        currentPage
        lastPage
        hasMorePages
      }
    }
  }
`

export const SUGGEST_NEXT_HOUSE = gql`
  query SuggestNextHouse($dahira_id: ID!, $scheduled_date: Date!) {
    suggestNextHouse(dahira_id: $dahira_id, scheduled_date: $scheduled_date) {
      id
      label
      address
      neighborhood
      capacity
      min_interval_weeks
      family {
        id
        name
        total_received
        last_received_at
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
