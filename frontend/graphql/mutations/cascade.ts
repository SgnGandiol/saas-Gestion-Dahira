import { gql } from '@apollo/client/core'

export const RESCHEDULE_ROTATION = gql`
  mutation RescheduleRotation(
    $id: ID!
    $scheduled_date: Date
    $mode: CascadeMode!
    $shift_weeks: Int
    $motif: RotationMotif!
    $motif_detail: String
  ) {
    rescheduleRotation(
      id: $id
      scheduled_date: $scheduled_date
      mode: $mode
      shift_weeks: $shift_weeks
      motif: $motif
      motif_detail: $motif_detail
    ) {
      applied_count
      skipped_locked
      headquarters_rotation {
        id
        status
        scheduled_date
        house { id label address }
        member { id full_name }
      }
      rotations {
        id
        scheduled_date
        status
        house { id label address }
        member { id full_name }
      }
    }
  }
`

export const CANCEL_ROTATION = gql`
  mutation CancelRotation(
    $id: ID!
    $mode: CascadeMode!
    $motif: RotationMotif!
    $motif_detail: String
  ) {
    cancelRotation(
      id: $id
      mode: $mode
      motif: $motif
      motif_detail: $motif_detail
    ) {
      applied_count
      skipped_locked
      headquarters_rotation {
        id
        status
        scheduled_date
        house { id label address }
        member { id full_name }
      }
      rotations { id scheduled_date status }
    }
  }
`
