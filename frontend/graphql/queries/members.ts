import { gql } from '@apollo/client/core'

export const GET_MEMBERS = gql`
  query GetMembers($dahira_id: ID!, $page: Int, $first: Int) {
    members(dahira_id: $dahira_id, first: $first, page: $page) {
      data {
        id
        full_name
        first_name
        last_name
        phone
        email
        gender
        profession
        is_active
        joined_at
        house {
          id
          label
          address
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

export const GET_MEMBER = gql`
  query GetMember($id: ID!) {
    member(id: $id) {
      id
      full_name
      first_name
      last_name
      phone
      email
      gender
      profession
      is_active
      joined_at
      notes
      dahira {
        id
        name
      }
      house {
        id
        label
        address
      }
    }
  }
`
