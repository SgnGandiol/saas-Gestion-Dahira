import { gql } from '@apollo/client/core'

export const GET_EVENTS = gql`
  query GetEvents($dahira_id: ID!, $first: Int, $page: Int) {
    events(dahira_id: $dahira_id, first: $first, page: $page) {
      data {
        id
        name
        type
        target_amount
        deadline
        color
        status
        description
        total_collected
        category_amounts {
          id
          amount
          category {
            id
            name
            label
            color
          }
        }
      }
      paginatorInfo { total }
    }
  }
`

export const GET_EVENT_CONTRIBUTIONS = gql`
  query GetEventContributions($dahira_id: ID!, $event_id: ID!, $first: Int, $page: Int) {
    contributions(dahira_id: $dahira_id, event_id: $event_id, first: $first, page: $page) {
      data {
        id
        amount
        paid_at
        status
        notes
        member {
          id
          full_name
          category {
            id
            name
            label
            color
          }
        }
      }
      paginatorInfo { total }
    }
  }
`
