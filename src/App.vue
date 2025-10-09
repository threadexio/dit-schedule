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
    <div>
      <label for="semester">Semester:</label>
      <select v-model="selected_schedule">
        <option v-if="manifest !== undefined" v-for="x in manifest.schedules" :value="x">
          {{ x.name }}
        </option>
      </select>
    </div>
    <Schedule
      v-if="selected_schedule_manifest !== undefined"
      :schedule="selected_schedule_manifest"
    />
  </div>
</template>

<style scoped></style>
