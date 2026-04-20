import { gql } from '@apollo/client/core'

export const CREATE_MEMBER = gql`
  mutation CreateMember(
    $dahira_id: ID!
    $house_id: ID
    $first_name: String!
    $last_name: String!
    $phone: String
    $email: String
    $gender: Gender!
    $profession: String
  ) {
    createMember(
      input: {
        dahira_id: $dahira_id
        house_id: $house_id
        first_name: $first_name
        last_name: $last_name
        phone: $phone
        email: $email
        gender: $gender
        profession: $profession
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
      joined_at
      house {
        id
        label
        address
      }
    }
  }
`

export const UPDATE_MEMBER = gql`
  mutation UpdateMember(
    $id: ID!
    $house_id: ID
    $first_name: String
    $last_name: String
    $phone: String
    $email: String
    $gender: Gender
    $profession: String
    $is_active: Boolean
  ) {
    updateMember(
      id: $id
      input: {
        house_id: $house_id
        first_name: $first_name
        last_name: $last_name
        phone: $phone
        email: $email
        gender: $gender
        profession: $profession
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
      joined_at
      house {
        id
        label
        address
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
