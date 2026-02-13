<script setup lang="ts">
import { enumerate } from './utils.ts'
import { Manifest } from './schedule.ts'

defineProps<{
  manifest: Manifest | undefined
}>()

const model = defineModel()
</script>

<template>
  <div>
    <label>Semester:</label>
    <select v-if="manifest !== undefined" v-model="model">
      <option v-for="[i, x] in enumerate(manifest.schedules)" :key="i" :value="x">
        {{ x.name }}
      </option>
    </select>
    <select v-else>
      <option>-- No semesters --</option>
    </select>
  </div>
</template>

<style scoped>
label {
  padding-right: 0.5em;
}
</style>
