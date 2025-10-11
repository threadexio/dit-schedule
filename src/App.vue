<script setup lang="ts">
import { ref, watch } from 'vue'
import { Manifest, Schedule } from './schedule.ts'

import ScheduleComponent from './Schedule.vue'
import ScheduleSelector from './ScheduleSelector.vue'

const manifest = ref<undefined | Manifest>(undefined)

const selected_schedule = ref<undefined | Schedule>(undefined)
watch(selected_schedule, async (final) => {
  if (final !== undefined) {
    await final.fetch()
  }
})

async function init() {
  manifest.value = await Manifest.fetch()

  const l = manifest.value.schedules.length
  if (l > 0) selected_schedule.value = manifest.value.schedules[l - 1]
}

init()
</script>

<template>
  <div>
    <div class="header">
      <ScheduleSelector :manifest="manifest" v-model="selected_schedule" />
    </div>
    <div>
      <ScheduleComponent
        v-if="selected_schedule !== undefined && selected_schedule.fetched()"
        :schedule="selected_schedule"
      />
    </div>
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
</style>
