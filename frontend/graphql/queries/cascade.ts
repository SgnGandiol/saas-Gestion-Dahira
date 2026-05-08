import { gql } from '@apollo/client/core'

export const PREVIEW_CASCADE = gql`
  query PreviewCascade($from_rotation_id: ID!, $mode: CascadeMode!, $shift_weeks: Int) {
    previewCascade(from_rotation_id: $from_rotation_id, mode: $mode, shift_weeks: $shift_weeks) {
      items {
        rotation_id
        member_name
        house_label
        old_date
        new_date
        is_locked
      }
      meta {
        mode
        total_affected
        locked_skipped
        shift_weeks
      }
      has_locked_warning
    }
  }
`
