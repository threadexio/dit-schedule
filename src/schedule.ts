import * as ical from 'ical-generator'
import * as uuid from 'uuid'
import { map, filter_map, shift } from './utils.ts'

///////////////////////////////////////////////////////////////////////////////

interface ManifestData {
  schedules: ManifestScheduleData[]
}

export class Manifest {
  public schedules: Schedule[]

  constructor(data: ManifestData) {
    this.schedules = Array.from(map(data.schedules, (x) => new Schedule(x)))
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
  start: number
  end: number
  lessons: LessonData[]
}

export class Schedule {
  public name: string
  public path: string

  private _manifest?: {
    start: Date
    end: Date
    lessons: Lesson[]
  }

  constructor(data: ManifestScheduleData) {
    this.name = data.name
    this.path = data.path
  }

  static async fetch(data: ManifestScheduleData): Promise<Schedule> {
    const x = new Schedule(data)
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

  toICS(lessons: Set<number>): string {
    const now = new Date()

    const events: ical.ICalEventData[] = Array.from(
      map(
        filter_map(lessons.values(), (i) => this.lessons[i]),
        (lesson) => {
          let day_offset = lesson.day.index
          if (day_offset < this.start.getDay()) {
            day_offset += 7
          }

          day_offset -= this.start.getDay()

          const start = shift(this.start, { days: day_offset, ms: lesson.start })
          const end = shift(start, { ms: lesson.duration })

          return {
            id: uuid.v4(),
            summary: lesson.name,
            description: `In ${lesson.room} with ${lesson.profs.join(', ')}.`,
            created: now,
            start: start,
            end: end,

            alarms: [
              {
                type: ical.ICalAlarmType.display,
                description: `Reminder: ${lesson.name} in 10 minutes.`,
                trigger: 10 * 60,
                repeat: null,
                interval: null,
                relatesTo: null,
                attach: null,
                attendees: [],
              },
            ],

            sequence: 0,
            repeating: {
              freq: ical.ICalEventRepeatingFreq.WEEKLY,
              until: shift(this.end, { days: 1 }),
            },

            allDay: false,
            attachments: [],
            attendees: [],
            url: 'https://di.uoa.gr',
            location: 'Department of Informatics and Telecommunications, Zografou 161 22, Greece',
          }
        },
      ),
    )

    const cal = new ical.ICalCalendar({
      name: 'DIT Schedule',
      description: 'DIT Schedule',
      prodId: '-//threadexio//dit-schedule//EN',
      timezone: 'Europe/Athens',
      url: 'https://di.uoa.gr',
      events: events,
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
