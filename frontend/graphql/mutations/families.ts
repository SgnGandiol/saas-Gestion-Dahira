import { gql } from '@apollo/client/core'

export const CREATE_HOUSE = gql`
  mutation CreateHouse(
    $dahira_id: ID!
    $label: String
    $address: String!
    $neighborhood: String
    $capacity: Int
    $min_interval_weeks: Int
  ) {
    createHouse(input: {
      dahira_id: $dahira_id
      label: $label
      address: $address
      neighborhood: $neighborhood
      capacity: $capacity
      min_interval_weeks: $min_interval_weeks
    }) {
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
  }
`

export const UPDATE_HOUSE = gql`
  mutation UpdateHouse(
    $id: ID!
    $label: String
    $address: String
    $neighborhood: String
    $capacity: Int
    $min_interval_weeks: Int
    $is_available: Boolean
  ) {
    updateHouse(id: $id, input: {
      label: $label
      address: $address
      neighborhood: $neighborhood
      capacity: $capacity
      min_interval_weeks: $min_interval_weeks
      is_available: $is_available
    }) {
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
  }
`

export const DELETE_HOUSE = gql`
  mutation DeleteHouse($id: ID!) {
    deleteHouse(id: $id) {
      id
    }
  }
`
