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
          members {
            id
            full_name
            phone
          }
        }
        member {
          id
          full_name
          phone
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
      total_received
      last_received_at
    }
  }
`
