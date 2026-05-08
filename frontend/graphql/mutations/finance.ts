import { gql } from '@apollo/client/core'

export const RECORD_CONTRIBUTION = gql`
  mutation RecordContribution(
    $dahira_id: ID!
    $member_id: ID!
    $type: ContributionType!
    $amount: Float!
    $paid_at: Date!
    $period: String
    $status: ContributionStatus!
    $notes: String
  ) {
    recordContribution(input: {
      dahira_id: $dahira_id
      member_id: $member_id
      type: $type
      amount: $amount
      paid_at: $paid_at
      period: $period
      status: $status
      notes: $notes
    }) {
      id
      type
      amount
      paid_at
      period
      status
      member { id full_name }
    }
  }
`

export const CREATE_EXPENSE = gql`
  mutation CreateExpense(
    $dahira_id: ID!
    $label: String!
    $category: ExpenseCategory!
    $amount: Float!
    $spent_at: Date!
    $notes: String
  ) {
    createExpense(input: {
      dahira_id: $dahira_id
      label: $label
      category: $category
      amount: $amount
      spent_at: $spent_at
      notes: $notes
    }) {
      id
      label
      category
      amount
      spent_at
      notes
    }
  }
`
