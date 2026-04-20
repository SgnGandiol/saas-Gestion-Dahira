import { gql } from '@apollo/client/core'

export const CREATE_FAMILY = gql`
  mutation CreateFamily(
    $dahira_id: ID!
    $name: String!
    $address: String
    $neighborhood: String
    $phone: String
    $capacity: Int
    $is_available: Boolean
  ) {
    createFamily(input: {
      dahira_id: $dahira_id
      name: $name
      address: $address
      neighborhood: $neighborhood
      phone: $phone
      capacity: $capacity
      is_available: $is_available
    }) {
      id
      name
      address
      neighborhood
      phone
      capacity
      is_available
      total_received
    }
  }
`

export const UPDATE_FAMILY = gql`
  mutation UpdateFamily(
    $id: ID!
    $name: String
    $address: String
    $neighborhood: String
    $phone: String
    $capacity: Int
    $is_available: Boolean
  ) {
    updateFamily(id: $id, input: {
      name: $name
      address: $address
      neighborhood: $neighborhood
      phone: $phone
      capacity: $capacity
      is_available: $is_available
    }) {
      id
      name
      address
      neighborhood
      phone
      capacity
      is_available
    }
  }
`

export const CREATE_HOUSE = gql`
  mutation CreateHouse(
    $dahira_id: ID!
    $family_id: ID!
    $label: String
    $address: String!
    $neighborhood: String
    $capacity: Int
    $min_interval_weeks: Int
  ) {
    createHouse(input: {
      dahira_id: $dahira_id
      family_id: $family_id
      label: $label
      address: $address
      neighborhood: $neighborhood
      capacity: $capacity
      min_interval_weeks: $min_interval_weeks
    }) {
      id
      label
      address
      capacity
      is_available
      min_interval_weeks
      family { id name }
    }
  }
`
