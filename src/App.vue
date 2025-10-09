<script setup lang="ts">
import { ref, watch } from 'vue'
import * as types from './types.ts'
import Schedule from './Schedule.vue'

const manifest = ref<undefined | types.Manifest>(undefined)
const selected_schedule = ref<undefined | types.Schedule>(undefined)
const selected_schedule_manifest = ref<undefined | types.ScheduleManifest>(undefined)

watch(selected_schedule, async (final, prev) => {
  if (final === undefined) {
    return
  }

  const r = await fetch(`schedules/${final.path}`)
  selected_schedule_manifest.value = (await r.json()) as types.ScheduleManifest
})

async function init() {
  const r = await fetch('schedules/manifest.json')
  manifest.value = (await r.json()) as types.Manifest

  const l = manifest.value.schedules.length
  if (l > 0) selected_schedule.value = manifest.value.schedules[l - 1]
}

init()
</script>

<template>
  <div>
    <div class="header">
      <div class="semester-selector">
        <label for="semester">Semester:</label>
        <select v-model="selected_schedule">
          <option v-if="manifest !== undefined" v-for="x in manifest.schedules" :value="x">
            {{ x.name }}
          </option>
        </select>
      </div>
    </div>
    <Schedule
      v-if="selected_schedule_manifest !== undefined"
      :schedule="selected_schedule_manifest"
    />
  </div>
</template>

<style scoped>
.header {
  box-sizing: border-box;
  padding: 0.5em;
  width: 100%;
  height: 3em;

  background: rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid rgb(72, 72, 74);

  display: flex;
  flex-direction: row;
  align-items: center;
}

.semester-selector > label {
  padding-right: 0.5em;
}

.semester-selector > select {
  background: rgb(36, 36, 38);
  color: unset;
  border: 1px solid rgb(72, 72, 74);
  border-radius: 5px;
  padding: 0.1em;
}
</style>
