import { gql } from '@apollo/client/core'

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      name
      type
      target_amount
      deadline
      color
      status
      description
      total_collected
      category_amounts {
        id
        amount
        category { id name label color }
      }
    }
  }
`

export const CLOSE_EVENT = gql`
  mutation CloseEvent($id: ID!) {
    closeEvent(id: $id) {
      id
      status
    }
  }
`

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
      id
    }
  }
`

export const RECORD_EVENT_CONTRIBUTION = gql`
  mutation RecordEventContribution(
    $dahira_id: ID!
    $member_id: ID!
    $event_id: ID!
    $amount: Float!
    $paid_at: Date!
    $status: ContributionStatus!
    $notes: String
  ) {
    recordContribution(input: {
      dahira_id: $dahira_id
      member_id: $member_id
      event_id: $event_id
      type: autre
      amount: $amount
      paid_at: $paid_at
      status: $status
      notes: $notes
    }) {
      id
      amount
      paid_at
      status
      member { id full_name }
    }
  }
`
