<script setup lang="ts">
import { enumerate, download } from './utils.ts'
import { Schedule } from './schedule.ts'
import { Share } from './share.ts'

const props = defineProps<{
  schedule: Schedule
}>()

const lessons = defineModel<Set<number>>('lessons', { required: true })

function toggleLesson(i: number) {
  if (lessons.value.has(i)) lessons.value.delete(i)
  else lessons.value.add(i)
}

function formatMsToHM(ms: number): string {
  const hours = ms / (60 * 60 * 1000)
  ms -= hours * 60 * 60 * 1000
  const minutes = ms / (60 * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function doShare() {
  const share = new Share(props.schedule.id, lessons.value)

  const url = new URL(window.location.toString())
  url.searchParams.set('share', share.toString())
  navigator.clipboard.writeText(url.toString())
  alert(url.toString())
}

function doExportIcs() {
  download(props.schedule.toICS(lessons.value), {
    type: 'text/calendar',
    filename: 'dit-schedule.ics',
  })
}
</script>

<template>
  <div>
    <div class="header">
      <button @click="doShare()">Share</button>
      <button @click="doExportIcs()">Export to ICS</button>
    </div>
    <ul class="lessons">
      <li v-for="[i, x] in enumerate(schedule.lessons)" :key="i" @click="toggleLesson(i)">
        <input type="checkbox" v-model="lessons" :value="i" />
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
