<script setup lang="ts">
import { ref, watch } from 'vue'
import { enumerate, download, filter, filter_map, implies } from './utils.ts'
import { Schedule, Lesson } from './schedule.ts'
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

const visibilityName = ref<string | undefined>()
const visibilitySemester = ref<string | undefined>()

watch(visibilitySemester, () => {
  visibilityName.value = undefined
})

function isLessonVisibleByName(lesson: Lesson): boolean {
  return implies(visibilityName.value !== undefined, visibilityName.value === lesson.name)
}

function isLessonVisibleBySemester(lesson: Lesson): boolean {
  return implies(
    visibilitySemester.value !== undefined,
    visibilitySemester.value === lesson.semester,
  )
}

function isLessonVisible(lesson: Lesson) {
  return isLessonVisibleByName(lesson) && isLessonVisibleBySemester(lesson)
}
</script>

<template>
  <div>
    <div class="header glass">
      <button @click="doShare()">Share</button>
      <button @click="doExportIcs()">Export to ICS</button>
    </div>
    <ul class="lessons">
      <li
        v-for="[i, x] in filter(enumerate(schedule.lessons), ([i, x]) => isLessonVisible(x))"
        :key="i"
        @click="toggleLesson(i)"
      >
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
    <div class="footer glass">
      <div>
        <label>Filter by semester:</label>
        <select v-model="visibilitySemester">
          <option :value="undefined">All</option>
          <option
            v-for="[i, x] in enumerate(
              Array.from(new Set(schedule.lessons.map((x) => x.semester))).sort(),
            )"
            :key="i"
            :value="x"
          >
            {{ x }}
          </option>
        </select>
      </div>
      <div>
        <label>Filter by name:</label>
        <select v-model="visibilityName">
          <option :value="undefined">All</option>
          <option
            v-for="[i, x] in enumerate(
              Array.from(
                new Set(
                  filter_map(schedule.lessons, (x) =>
                    isLessonVisibleBySemester(x) ? x.name : undefined,
                  ),
                ),
              ).sort(),
            )"
            :key="i"
            :value="x"
          >
            {{ x }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: brightness(80%) saturate(50%) blur(8px);
}

.header {
  position: sticky;
  top: 0%;
  box-sizing: border-box;
  padding: 0.5em;
  width: 100%;
  height: 3em;
  z-index: 999;
  border-bottom: 1px solid rgb(72, 72, 74);

  display: flex;
  flex-direction: row;
  align-items: center;
}

.header > * {
  padding: 1em;
}

.header > button {
  height: 100%;
  font-size: 0.8em;
}

.header > div > label {
  font-size: 0.8em;
  padding-right: 0.5em;
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

.footer {
  position: sticky;
  bottom: 0%;
  box-sizing: border-box;
  padding: 0.5em;
  width: 100%;
  z-index: 999;
  border-top: 1px solid rgb(72, 72, 74);

  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;

  overflow-x: clip;
}

.footer > * {
  padding-left: 0.5em;
  padding-right: 0.5em;
}

.footer > div {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
}

.footer > div > label {
  padding-right: 0.5em;
}

.footer > div > select {
  width: 10em;
}
</style>
