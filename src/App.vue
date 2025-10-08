<script setup lang="ts">
import { ref } from 'vue'
import * as ical from 'ical-generator'

const manifest = ref({
  schedules: [],
})

const selected_schedule_manifest = ref({})
const selected_schedule = ref({
  lessons: [],
})
const selected_lessons = ref(new Set())

async function init() {
  const res = await fetch('schedules/manifest.json')
  manifest.value = await res.json()

  selected_schedule_manifest.value = manifest.value.schedules.at(-1)
  await fetchSchedule()
}

async function fetchSchedule() {
  const res = await fetch(`schedules/${selected_schedule_manifest.value.path}`)
  selected_schedule.value = await res.json()
}

function formatMsToHM(ms: number): string {
  const hours = ms / (60 * 60 * 1000)
  ms -= hours * 60 * 60 * 1000
  const minutes = ms / (60 * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function exportIcs() {
  const now = new Date()

  const lessons = Array.from(selected_lessons.value.values()).map(
    (i) => selected_schedule.value.lessons[i],
  )

  const semester_start = new Date(selected_schedule.value.start)
  const semester_end = new Date(selected_schedule.value.end)

  const events: ical.ICalEventData[] = lessons.map((lesson) => {
    let day_offset
    switch (lesson.day) {
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

    const start = shift(semester_start, { days: day_offset, ms: lesson.start })
    const end = shift(start, { ms: lesson.duration })

    return {
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

  const ics = cal.toString()
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'dit-schedule.ics'
  a.click()
  URL.revokeObjectURL(url)
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

init()
</script>

<template>
  <div>
    <div>
      <label for="semester">Semester:</label>
      <select v-model="selected_schedule_manifest" @change="fetchSchedule()">
        <option v-for="x in manifest.schedules" :value="x">
          {{ x.name }}
        </option>
      </select>
    </div>
    <div>
      <button @click="exportIcs()">Export to ICS</button>
      <ul>
        <li v-for="[i, x] in selected_schedule.lessons.map((x, i) => [i, x])">
          <h3>{{ x.name }}</h3>
          <ul>
            <li>{{ x.semester }}</li>
            <li>with {{ x.profs.join(', ') }}</li>
            <li>every {{ x.day }}</li>
            <li>from {{ formatMsToHM(x.start) }} to {{ formatMsToHM(x.start + x.duration) }}</li>
          </ul>
          <input type="checkbox" v-model="selected_lessons" :value="i" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped></style>
