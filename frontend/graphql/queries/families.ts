import { gql } from '@apollo/client/core'

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
        total_received
        last_received_at
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
