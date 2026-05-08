import { gql } from '@apollo/client/core'

export const UPDATE_MEMBER_AVAILABILITY = gql`
  mutation UpdateMemberAvailability($id: ID!, $availability_status: MemberAvailabilityStatus!) {
    updateMemberAvailability(id: $id, availability_status: $availability_status) {
      id
      full_name
      availability_status
    }
  }
`

export const APPLY_ROTATION_SOLUTION = gql`
  mutation ApplyRotationSolution($rotation_id: ID!, $solution_type: String!, $meta: String) {
    applyRotationSolution(rotation_id: $rotation_id, solution_type: $solution_type, meta: $meta) {
      id
      scheduled_date
      status
      member { id full_name }
      house { id label address }
    }
  }
`

export const APPLY_REBUILD = gql`
  mutation ApplyRebuild($preview: RebuildPreviewInput!) {
    applyRebuild(preview: $preview) {
      id
      scheduled_date
      status
      member { id full_name }
      house { id label address }
    }
  }
`

export const CANCEL_REBUILD = gql`
  mutation CancelRebuild($rebuild_id: ID!) {
    cancelRebuild(rebuild_id: $rebuild_id)
  }
`
