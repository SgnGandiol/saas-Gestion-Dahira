import { gql } from '@apollo/client/core'

export const CREATE_DAHIRA = gql`
  mutation CreateDahira(
    $name: String!
    $city: String
    $country: String
    $phone: String
    $email: String
    $description: String
    $is_active: Boolean
  ) {
    createDahira(
      input: {
        name: $name
        city: $city
        country: $country
        phone: $phone
        email: $email
        description: $description
        is_active: $is_active
      }
    ) {
      dahira {
        id
        name
        slug
        city
        country
        phone
        email
        description
        is_active
        created_at
      }
      admin_email
      admin_password
    }
  }
`

export const UPDATE_DAHIRA = gql`
  mutation UpdateDahira(
    $id: ID!
    $name: String
    $city: String
    $country: String
    $phone: String
    $email: String
    $description: String
    $is_active: Boolean
  ) {
    updateDahira(
      id: $id
      input: {
        name: $name
        city: $city
        country: $country
        phone: $phone
        email: $email
        description: $description
        is_active: $is_active
      }
    ) {
      id
      name
      slug
      city
      country
      phone
      email
      description
      is_active
      created_at
    }
  }
`

export const DELETE_DAHIRA = gql`
  mutation DeleteDahira($id: ID!) {
    deleteDahira(id: $id) {
      id
    }
  }
`
