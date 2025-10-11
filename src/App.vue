<script setup lang="ts">
import { ref, watch } from 'vue'
import { Manifest, Schedule } from './schedule.ts'
import { Share } from './share.ts'

import ScheduleComponent from './Schedule.vue'
import ScheduleSelector from './ScheduleSelector.vue'

const manifest = ref<undefined | Manifest>(undefined)

const selected_schedule = ref<undefined | Schedule>(undefined)
watch(selected_schedule, async (final) => {
  if (final !== undefined) {
    await final.fetch()
  }
})

const selected_lessons = ref<Set<number>>(new Set())

async function init() {
  manifest.value = await Manifest.fetch()

  const l = manifest.value.schedules.length
  const here = new URL(window.location.toString())

  let done = false

  const share_code = here.searchParams.get('share')
  if (share_code !== null) {
    try {
      const share = Share.parse(share_code)
      selected_schedule.value = manifest.value.schedules[share.schedule]
      selected_lessons.value = share.lessons
      done = true
    } catch (e) {
      console.error(e)
    }
  }

  if (!done) {
    selected_schedule.value = manifest.value.schedules[l - 1]
  }

  watch(selected_schedule, () => {
    selected_lessons.value.clear()
  })
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
        v-model:lessons="selected_lessons"
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
