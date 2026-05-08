import { gql } from '@apollo/client/core'

export const SCHEDULE_ROTATION = gql`
  mutation ScheduleRotation($dahira_id: ID!, $scheduled_date: Date!, $member_id: ID!, $force_rebuild: Boolean) {
    scheduleRotation(
      dahira_id: $dahira_id
      scheduled_date: $scheduled_date
      member_id: $member_id
      force_rebuild: $force_rebuild
    ) {
      rotation {
        id
        scheduled_date
        status
        member { id full_name }
        house { id label address }
      }
      replaced_rotation { id scheduled_date }
      rebuild_applied
      rebuild_count
    }
  }
`

export const AUTO_SCHEDULE_ROTATION = gql`
  mutation AutoScheduleRotation($dahira_id: ID!, $scheduled_date: Date!) {
    autoScheduleRotation(dahira_id: $dahira_id, scheduled_date: $scheduled_date) {
      id
      scheduled_date
      status
      member {
        id
        full_name
      }
      house {
        id
        label
        address
        capacity
        total_received
        last_received_at
      }
    }
  }
`

export const UPDATE_ROTATION_STATUS = gql`
  mutation UpdateRotationStatus($id: ID!, $status: RotationStatus!) {
    updateRotationStatus(id: $id, status: $status) {
      id
      status
      attendees_count
    }
  }
`

export const RESCHEDULE_ROTATION = gql`
  mutation RescheduleRotation($id: ID!, $scheduled_date: Date!) {
    rescheduleRotation(id: $id, scheduled_date: $scheduled_date) {
      id
      scheduled_date
      status
    }
  }
`

export const SCHEDULE_PERIOD_ROTATIONS = gql`
  mutation SchedulePeriodRotations($dahira_id: ID!, $start_date: Date!, $end_date: Date!) {
    schedulePeriodRotations(dahira_id: $dahira_id, start_date: $start_date, end_date: $end_date) {
      created_count
      skipped_count
      skipped_dates
      rotations {
        id
        scheduled_date
        status
        house {
          id
          label
          address
        }
      }
    }
  }
`

export const TOGGLE_ASSIGNMENT = gql`
  mutation ToggleAssignment($id: ID!) {
    toggleAssignment(id: $id) {
      id
      completed
    }
  }
`

export const DELETE_ASSIGNMENT = gql`
  mutation DeleteAssignment($id: ID!) {
    deleteAssignment(id: $id) {
      id
    }
  }
`

export const CREATE_ASSIGNMENT = gql`
  mutation CreateAssignment($dahira_id: ID!, $rotation_id: ID!, $member_id: ID!, $task: TaskType!, $notes: String) {
    createAssignment(input: {
      dahira_id: $dahira_id
      rotation_id: $rotation_id
      member_id: $member_id
      task: $task
      notes: $notes
    }) {
      id
      task
      completed
      member { id full_name }
    }
  }
`
