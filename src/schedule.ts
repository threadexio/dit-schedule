import * as ical from 'ical-generator'
import type { shouldTransformRef } from 'vue/compiler-sfc'

export class When {
  day: string
  start: number
  duration: number

  constructor(day: string, start: number, duration: number) {
    this.day = day
    this.start = start
    this.duration = duration
  }
}

export class Slot {
  public name: string
  public semester: string
  public profs: string[]
  public when: When
  public where: string

  constructor(name: string, semester: string, profs: string[], when: When, where: string) {
    this.name = name
    this.semester = semester
    this.profs = profs
    this.when = when
    this.where = where
  }
}

export class Schedule {
  public slots: Slot[]

  constructor(slots: Slot[]) {
    this.slots = slots
  }

  public static parseHtml(html: string): Schedule {
    const root = document.createElement('div')
    root.innerHTML = html

    let slots: Slot[] = []
    let trs = root.querySelectorAll('table > tbody > tr').values()

    const parseDay = () => {
      const day = trs.next().value!.querySelector('td > b > font')?.innerHTML!

      const rooms = Array.from(
        trs.next().value!.querySelectorAll('td:not(:first-child)').values(),
      ).map((x) => x.querySelector('b > font')?.innerHTML!)

      for (let i = 0; i < 12; i++) {
        const tds = trs.next().value!.querySelectorAll('td').values()

        const parseTsHM = (x: string): number => {
          const [hoursStr, minutesStr] = x.split(':', 2)
          const hours = parseInt(hoursStr!, 10)
          const minutes = parseInt(minutesStr!, 10)
          return (hours * 60 + minutes) * 60 * 1000
        }

        const whenStr = tds.next().value?.querySelector('font')?.innerText!
        const [startStr, endStr] = whenStr.split('-', 2)
        const start = parseTsHM(startStr!)
        const end = parseTsHM(endStr!)

        const when = new When(day, start, end - start)

        for (const where of rooms) {
          const desc = tds.next().value?.querySelector('td > font')?.childNodes!
          if (desc.length != 5) continue

          const name = desc[0]?.textContent?.trim()!
          const semester = desc[2]?.textContent?.trim()!
          const profs = desc[4]?.textContent?.trim()?.split(/,\s/g)!

          const slot = new Slot(name, semester, profs, when, where)
          slots.push(slot)
        }
      }
    }

    parseDay()
    for (let i = 0; i < 4; i++) {
      trs.next()
      trs.next()
      parseDay()
    }

    return new Schedule(slots)
  }

  public add(slot: Slot) {
    this.slots.push(slot)
  }

  public toIcs(): string {
    const now = new Date()

    const semester_start = new Date(2025, 8, 29)
    const semester_end = new Date(2026, 0, 9)

    const events: ical.ICalEventData[] = this.slots.map((slot) => {
      let day_offset
      switch (slot.when.day) {
        case 'Κυριακή': {
          day_offset = 0
          break
        }

        case 'Δευτέρα': {
          day_offset = 1
          break
        }
        case 'Τρίτη': {
          day_offset = 2
          break
        }
        case 'Τετάρτη': {
          day_offset = 3
          break
        }
        case 'Πέμπτη': {
          day_offset = 4
          break
        }
        case 'Παρασκευή': {
          day_offset = 5
          break
        }

        case 'Σάββατο': {
          day_offset = 6
          break
        }

        default: {
          throw new Error('unknown day')
        }
      }

      if (day_offset < semester_start.getDay()) {
        day_offset += 7
      }

      day_offset -= semester_start.getDay()

      const start = shift(semester_start, { days: day_offset, ms: slot.when.start })
      const end = shift(start, { ms: slot.when.duration })

      return {
        summary: slot.name,
        description: `In ${slot.where} with ${slot.profs.join(', ')}.`,
        created: now,
        start: start,
        end: end,

        alarms: [
          {
            type: ical.ICalAlarmType.display,
            description: `Reminder: ${slot.name} in 10 minutes.`,
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
          until: semester_end,
        },

        allDay: false,
        attachments: [],
        attendees: [],
        url: 'https://di.uoa.gr',
        location: 'Department of Informatics and Telecommunications, Zografou 161 22, Greece',
      }
    })

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

function shift(
  t: Date,
  by: {
    ms?: number
    seconds?: number
    minutes?: number
    hours?: number
    days?: number
  },
): Date {
  let x = t.getTime()

  if (by.ms !== undefined) {
    x += by.ms
  }

  if (by.seconds !== undefined) {
    x += by.seconds * 1000
  }

  if (by.minutes !== undefined) {
    x += by.minutes * 60 * 1000
  }

  if (by.hours !== undefined) {
    x += by.hours * 60 * 60 * 1000
  }

  if (by.days !== undefined) {
    x += by.days * 24 * 60 * 60 * 1000
  }

  return new Date(x)
}
