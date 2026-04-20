import { gql } from '@apollo/client/core'

export const GET_FAMILIES = gql`
  query GetFamilies($dahira_id: ID!, $first: Int, $page: Int) {
    families(dahira_id: $dahira_id, first: $first, page: $page) {
      data {
        id
        name
        address
        neighborhood
        phone
        capacity
        is_available
        total_received
        last_received_at
        members {
          id
          full_name
          is_family_head
          is_active
        }
        house {
          id
          label
          address
          capacity
          is_available
          min_interval_weeks
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

export const GET_HOUSES = gql`
  query GetHouses($dahira_id: ID!, $first: Int, $page: Int) {
    houses(dahira_id: $dahira_id, first: $first, page: $page) {
      data {
        id
        label
        address
        neighborhood
        capacity
        is_available
        min_interval_weeks
        family {
          id
          name
        }
      }
      paginatorInfo {
        total
      }
    }
  }
`
