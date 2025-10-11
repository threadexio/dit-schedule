<script setup lang="ts">
import { ref, watch } from 'vue'
import { shift, enumerate, map, download } from './utils.ts'
import { Schedule, Lesson } from './schedule.ts'

const props = defineProps<{
  schedule: Schedule
}>()

const selected_lessons = ref(new Set<number>())

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
</script>

<template>
  <div>
    <div class="header">
      <button
        @click="
          download(schedule.toICS(selected_lessons), {
            type: 'text/calendar',
            filename: 'dit-schedule.ics',
          })
        "
      >
        Export to ICS
      </button>
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
