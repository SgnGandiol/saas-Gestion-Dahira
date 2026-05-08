import { gql } from '@apollo/client/core'

export const CREATE_MEMBER = gql`
  mutation CreateMember(
    $dahira_id: ID!
    $house_id: ID
    $member_category_id: ID
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
        member_category_id: $member_category_id
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
      availability_status
      priority_score
      photo_url
      house { id label address }
      category { id name label color weekly_amount }
    }
  }
`

export const UPDATE_MEMBER = gql`
  mutation UpdateMember(
    $id: ID!
    $house_id: ID
    $member_category_id: ID
    $first_name: String
    $last_name: String
    $phone: String
    $email: String
    $gender: Gender
    $profession: String
    $is_active: Boolean
    $photo_url: String
  ) {
    updateMember(
      id: $id
      input: {
        house_id: $house_id
        member_category_id: $member_category_id
        first_name: $first_name
        last_name: $last_name
        phone: $phone
        email: $email
        gender: $gender
        profession: $profession
        is_active: $is_active
        photo_url: $photo_url
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
      availability_status
      priority_score
      photo_url
      house { id label address }
      category { id name label color weekly_amount }
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
