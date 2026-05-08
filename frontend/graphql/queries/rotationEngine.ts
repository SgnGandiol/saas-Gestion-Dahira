import { gql } from '@apollo/client/core'

export const GET_ROTATION_LOGS = gql`
  query GetRotationLogs($rotation_id: ID!) {
    rotationLogs(rotation_id: $rotation_id) {
      id
      rotation_id
      action
      meta
      created_at
      created_by_name
    }
  }
`

export const SUGGEST_BEST_SOLUTION = gql`
  query SuggestBestSolution($rotation_id: ID!, $reason: String!) {
    suggestBestSolution(rotation_id: $rotation_id, reason: $reason) {
      gravity
      confidence
      score
      recommended_solution
      confidence_score
      all_solutions {
        type
        label
        date
        house_id
        member_id
        rotation_a_id
        rotation_b_id
        _score
      }
    }
  }
`

export const PREVIEW_REBUILD = gql`
  query PreviewRebuild($dahira_id: ID!, $from: Date!, $weeks: Int!, $mode: RebuildMode) {
    previewRebuild(dahira_id: $dahira_id, from: $from, weeks: $weeks, mode: $mode) {
      locked {
        rotation_id
        date
        member_name
        house_label
      }
      preview {
        rotation_id
        date
        old_member_id
        old_member_name
        old_house_label
        new_member_id
        new_member_name
        new_house_label
        change_type
      }
      meta {
        mode
        from
        to
        total_rotations
        changed
        unchanged
        stability_pct
      }
    }
  }
`
