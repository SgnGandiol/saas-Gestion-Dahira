import { gql } from '@apollo/client/core'

export const SCHEDULE_ROTATION = gql`
  mutation ScheduleRotation($dahira_id: ID!, $scheduled_date: Date!, $house_id: ID!) {
    scheduleRotation(dahira_id: $dahira_id, scheduled_date: $scheduled_date, house_id: $house_id) {
      id
      scheduled_date
      status
      house {
        id
        label
        address
        family { id name }
      }
    }
  }
`

export const AUTO_SCHEDULE_ROTATION = gql`
  mutation AutoScheduleRotation($dahira_id: ID!, $scheduled_date: Date!) {
    autoScheduleRotation(dahira_id: $dahira_id, scheduled_date: $scheduled_date) {
      id
      scheduled_date
      status
      house {
        id
        label
        address
        capacity
        family { id name total_received last_received_at }
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
