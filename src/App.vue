<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Schedule } from './schedule.ts'

const state = reactive({
  available: [],
  registered: new Map(),
})

async function init() {
  const r = await fetch('timetable_PPS_winter2526.html')
  const raw = await r.text()

  const schedule = Schedule.parseHtml(raw)
  state.available = schedule.slots
}

function exportIcs() {
  const slots = Array.from(state.registered.values())
  const schedule = new Schedule(slots)
  const ics = schedule.toIcs()
  console.log(ics)

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'dit-schedule.ics'
  a.click()
  URL.revokeObjectURL(url)
}

function formatMsToHM(ms: number): string {
  const hours = ms / (60 * 60 * 1000)
  ms -= hours * 60 * 60 * 1000
  const minutes = ms / (60 * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

init()
</script>

<template>
  <div>
    <button @click="exportIcs()">Export to ICS</button>
    <ul>
      <li v-for="[i, slot] in state.available.map((x, i) => [i, x])">
        <h3>{{ slot.name }}</h3>
        <ul>
          <li>{{ slot.semester }}</li>
          <li>with {{ slot.profs.join(', ') }}</li>
          <li>every {{ slot.when.day }}</li>
          <li>
            from {{ formatMsToHM(slot.when.start) }} to
            {{ formatMsToHM(slot.when.start + slot.when.duration) }}
          </li>
        </ul>
        <input
          type="checkbox"
          @input="
            (ev) => {
              if (ev.target.checked) state.registered.set(i, slot)
              else state.registered.delete(i)
            }
          "
        />
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
