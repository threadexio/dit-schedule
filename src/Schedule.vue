<script setup lang="ts">
import { ref, watch } from 'vue'
import { shift, enumerate, map } from './utils.ts'
import * as uuid from 'uuid'
import * as ical from 'ical-generator'
import * as types from './types.ts'

const props = defineProps<{
  schedule: types.ScheduleManifest
}>()

const selected_lessons = ref(new Set())

watch(
  () => props.schedule,
  (final, prev) => selected_lessons.value.clear(),
)

function toggleSelectedLesson(i: number) {
  if (selected_lessons.value.has(i)) selected_lessons.value.delete(i)
  else selected_lessons.value.add(i)
}

function formatMsToHM(ms: number): string {
  const hours = ms / (60 * 60 * 1000)
  ms -= hours * 60 * 60 * 1000
  const minutes = ms / (60 * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function exportIcs() {
  const now = new Date()

  const lessons = map(selected_lessons.value.values(), (i: number) => props.schedule.lessons[i])

  const semester_start = new Date(props.schedule.start)
  const semester_end = new Date(props.schedule.end)

  const events: ical.ICalEventData[] = Array.from(
    map(lessons, (lesson: types.Lesson) => {
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
          until: semester_end,
        },

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
</script>

<template>
  <div>
    <div class="header">
      <button @click="exportIcs()">Export to ICS</button>
    </div>
    <ul class="lessons">
      <li v-for="[i, x] in enumerate(schedule.lessons)" @click="toggleSelectedLesson(i)">
        <input type="checkbox" v-model="selected_lessons" :value="i" />
        <span class="lesson-name">{{ x.name }}</span>
        <ul>
          <li>{{ x.semester }}</li>
          <li>with {{ x.profs.join(', ') }}</li>
          <li>every {{ x.day }}</li>
          <li>from {{ formatMsToHM(x.start) }} to {{ formatMsToHM(x.start + x.duration) }}</li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0%;
  box-sizing: border-box;
  padding: 0.5em;
  width: 100%;
  height: 3em;

  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: brightness(80%) saturate(50%) blur(8px);
  border-bottom: 1px solid rgb(72, 72, 74);
  z-index: 999;

  display: flex;
  flex-direction: row;
  align-items: center;
}

.header > button {
  height: 100%;

  font-size: 0.8em;
  background: none;
  border: none;
  color: unset;
}

.header > button:hover {
  color: rgb(0, 145, 255);
  cursor: pointer;
}

.lessons {
}

.lessons > li {
  padding: 0.5em;
}

.lessons > li:nth-child(2n) {
  background: rgba(0, 0, 0, 0.25);
}

.lessons > li > ul {
  padding: 0.3em;
}

.lesson-name {
  margin-left: 0.5em;
  font-size: 1.25em;
  font-weight: bold;
}
</style>
