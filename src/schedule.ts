import * as ical from 'ical-generator'
import * as uuid from 'uuid'
import { enumerate, map, shift, any } from './utils.ts'

///////////////////////////////////////////////////////////////////////////////

interface ManifestData {
  schedules: ManifestScheduleData[]
}

export class Manifest {
  public schedules: Schedule[]

  constructor(data: ManifestData) {
    this.schedules = Array.from(map(enumerate(data.schedules), ([i, x]) => new Schedule(i, x)))
  }

  static async fetch(): Promise<Manifest> {
    const res = await fetch('schedules/manifest.json')
    const data = (await res.json()) as ManifestData
    return new Manifest(data)
  }
}

///////////////////////////////////////////////////////////////////////////////

interface ManifestScheduleData {
  name: string
  path: string
}

interface ScheduleManifestData {
  start: string
  end: string
  lessons: LessonData[]
  holidays: HolidayData[]
}

export class Schedule {
  public id: number
  public name: string
  public path: string

  private _manifest?: {
    start: Date
    end: Date
    lessons: Lesson[]
    holidays: Holiday[]
  }

  constructor(id: number, data: ManifestScheduleData) {
    this.id = id
    this.name = data.name
    this.path = data.path
  }

  static async fetch(id: number, data: ManifestScheduleData): Promise<Schedule> {
    const x = new Schedule(id, data)
    await x.fetch()
    return x
  }

  fetched(): boolean {
    return this._manifest !== undefined
  }

  async fetch(): Promise<void> {
    if (this._manifest !== undefined) return

    const res = await fetch(`schedules/${this.path}`)
    const data2 = (await res.json()) as ScheduleManifestData

    this._manifest = {
      start: new Date(data2.start),
      end: new Date(data2.end),
      lessons: Array.from(map(data2.lessons, (x) => new Lesson(x))),
      holidays: Array.from(map(data2.holidays, (x) => new Holiday(x))),
    }
  }

  get start(): Date {
    return this._manifest!.start
  }

  get end(): Date {
    return this._manifest!.end
  }

  get lessons(): Array<Lesson> {
    return this._manifest!.lessons
  }

  get holidays(): Array<Holiday> {
    return this._manifest!.holidays
  }

  toICS(selected_lessons: Set<number>): string {
    const now = new Date()

    const lessons = []
    for (const [id, lesson] of enumerate(this.lessons)) {
      if (!selected_lessons.has(id)) {
        continue
      }

      let week_offset = 0
      while (true) {
        const day_offset = -this.start.getDay() + lesson.day.index

        const start = shift(this.start, { weeks: week_offset, days: day_offset, ms: lesson.start })
        const end = shift(start, { ms: lesson.duration })

        if (start < this.start) {
          continue
        }

        if (this.end <= start || this.end <= end) {
          break
        }

        const is_holiday = any(this.holidays, (x) => x.contains(start) || x.contains(end))

        if (!is_holiday) {
          // TODO: remove, only show relevant for debugging
          if (start.getUTCMonth() == 1) {
            console.log('======================')
            console.log(lesson)
            console.log(start)
            console.log(end)
          }

          lessons.push({
            start,
            end,
            data: lesson,
          })
        }

        week_offset += 1
      }
    }

    const events: ical.ICalEventData[] = Array.from(
      map(lessons, (x) => {
        return {
          id: uuid.v4(),
          summary: x.data.name,
          description: `In ${x.data.room} with ${x.data.profs.join(', ')}.`,
          created: now,
          start: x.start,
          end: x.end,

          alarms: [
            {
              type: ical.ICalAlarmType.display,
              description: `Reminder: ${x.data.name} in 10 minutes.`,
              trigger: 10 * 60,
              repeat: null,
              interval: null,
              relatesTo: null,
              attach: null,
              attendees: [],
            },
          ],

          sequence: 0,
          repeating: null,

          allDay: false,
          attachments: [],
          attendees: [],
          url: 'https://di.uoa.gr',
          location: 'Department of Informatics and Telecommunications, Zografou 161 22, Greece',
        }
      }),
    )

    const cal = new ical.ICalCalendar({
      name: 'DIT Schedule',
      description: 'DIT Schedule',
      prodId: '-//threadexio/dit-schedule//EN',
      timezone: 'Europe/Athens',
      url: 'https://di.uoa.gr',
      events,
    })

    return cal.toString()
  }
}

///////////////////////////////////////////////////////////////////////////////

interface LessonData {
  name: string
  semester: string
  profs: string[]
  day: string
  start: number
  duration: number
  room: string
}

export class Lesson {
  public name: string
  public semester: string
  public profs: string[]
  public day: Day
  public start: number
  public duration: number
  public room: string

  constructor(data: LessonData) {
    this.name = data.name
    this.semester = data.semester
    this.profs = data.profs
    this.day = new Day(data.day)
    this.start = data.start
    this.duration = data.duration
    this.room = data.room
  }

  end(): number {
    return this.start + this.duration
  }
}

export class Day {
  public index: number

  constructor(day: number | string) {
    let idx = -1

    if (typeof day === 'number') {
      if (0 <= day && day <= 6) {
        idx = day
      } else {
        throw new RangeError(`invalid day '${day}'. day indexes should be in the range 0..7`)
      }
    } else if (typeof day === 'string') {
      const dayToIdxMap = new Map([
        ['Κυριακή', 0],
        ['Δευτέρα', 1],
        ['Τρίτη', 2],
        ['Τετάρτη', 3],
        ['Πέμπτη', 4],
        ['Παρασκευή', 5],
        ['Σάββατο', 6],
      ])

      const idx2 = dayToIdxMap.get(day)

      if (idx2 === undefined) {
        throw new Error(`unknown day '${day}'`)
      } else {
        idx = idx2
      }
    }

    this.index = idx
  }

  toString(): string {
    const idxToDayMap = new Map([
      [0, 'Κυριακή'],
      [1, 'Δευτέρα'],
      [2, 'Τρίτη'],
      [3, 'Τετάρτη'],
      [4, 'Πέμπτη'],
      [5, 'Παρασκευή'],
      [6, 'Σάββατο'],
    ])

    const str = idxToDayMap.get(this.index)

    if (str === undefined) {
      throw new Error('panic: day index should be in 0..7')
    } else {
      return str
    }
  }
}

///////////////////////////////////////////////////////////////////////////////

interface HolidayData {
  start: string
  end: string
}

export class Holiday {
  public start: Date
  public end: Date

  constructor(data: HolidayData) {
    this.start = new Date(data.start)
    this.end = new Date(data.end)
  }

  contains(x: Date): boolean {
    return this.start <= x && x <= this.end
  }
}
