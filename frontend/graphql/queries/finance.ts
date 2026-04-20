import { gql } from '@apollo/client/core'

export const GET_CONTRIBUTIONS = gql`
  query GetContributions($dahira_id: ID!, $member_id: ID, $first: Int, $page: Int) {
    contributions(dahira_id: $dahira_id, member_id: $member_id, first: $first, page: $page) {
      data {
        id
        type
        amount
        paid_at
        period
        status
        notes
        member {
          id
          full_name
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

export const GET_EXPENSES = gql`
  query GetExpenses($dahira_id: ID!, $first: Int, $page: Int) {
    expenses(dahira_id: $dahira_id, first: $first, page: $page) {
      data {
        id
        label
        category
        amount
        spent_at
        notes
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
