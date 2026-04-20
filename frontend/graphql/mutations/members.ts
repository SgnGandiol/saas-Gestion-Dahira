import { gql } from '@apollo/client/core'

export const CREATE_MEMBER = gql`
  mutation CreateMember(
    $dahira_id: ID!
    $first_name: String!
    $last_name: String!
    $phone: String
    $email: String
    $gender: Gender!
    $profession: String
    $family_id: ID
  ) {
    createMember(
      input: {
        dahira_id: $dahira_id
        first_name: $first_name
        last_name: $last_name
        phone: $phone
        email: $email
        gender: $gender
        profession: $profession
        family_id: $family_id
      }
    ) {
      id
      full_name
      first_name
      last_name
      phone
      email
      gender
      profession
      is_active
      is_family_head
      joined_at
      family {
        id
        name
      }
    }
  }
`

export const UPDATE_MEMBER = gql`
  mutation UpdateMember(
    $id: ID!
    $first_name: String
    $last_name: String
    $phone: String
    $email: String
    $gender: Gender
    $profession: String
    $family_id: ID
    $is_active: Boolean
  ) {
    updateMember(
      id: $id
      input: {
        first_name: $first_name
        last_name: $last_name
        phone: $phone
        email: $email
        gender: $gender
        profession: $profession
        family_id: $family_id
        is_active: $is_active
      }
    ) {
      id
      full_name
      first_name
      last_name
      phone
      email
      gender
      profession
      is_active
      is_family_head
      joined_at
      family {
        id
        name
      }
    }
  }
`

export const DELETE_MEMBER = gql`
  mutation DeleteMember($id: ID!) {
    deleteMember(id: $id) {
      id
      message
    }
  }
`
