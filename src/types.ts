export interface Manifest {
  schedules: Schedule[]
}

export interface Schedule {
  name: string
  path: string
}

export interface ScheduleManifest {
  start: number
  end: number
  lessons: Lesson[]
}

export interface Lesson {
  name: string
  semester: string
  profs: string[]
  day: string
  start: number
  duration: number
  room: string
}
