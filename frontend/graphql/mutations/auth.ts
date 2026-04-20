import { gql } from '@apollo/client/core'

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        roles
        dahira {
          id
          name
          city
        }
      }
    }
  }
`

export const REGISTER_MUTATION = gql`
  mutation Register(
    $name: String!
    $email: String!
    $password: String!
    $dahira_name: String!
    $city: String
  ) {
    register(
      name: $name
      email: $email
      password: $password
      dahira_name: $dahira_name
      city: $city
    ) {
      token
      user {
        id
        name
        email
        roles
        dahira {
          id
          name
          city
        }
      }
    }
  }
`

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`
