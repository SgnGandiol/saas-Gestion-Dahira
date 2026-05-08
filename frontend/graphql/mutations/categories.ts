import { gql } from '@apollo/client'

export const CREATE_MEMBER_CATEGORY = gql`
  mutation CreateMemberCategory($input: CreateMemberCategoryInput!) {
    createMemberCategory(input: $input) {
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

export const UPDATE_MEMBER_CATEGORY = gql`
  mutation UpdateMemberCategory($id: ID!, $input: UpdateMemberCategoryInput!) {
    updateMemberCategory(id: $id, input: $input) {
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

export const DELETE_MEMBER_CATEGORY = gql`
  mutation DeleteMemberCategory($id: ID!) {
    deleteMemberCategory(id: $id) {
      id
    }
  }
`
