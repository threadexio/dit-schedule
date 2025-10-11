<script setup lang="ts">
import { defineProps, defineModel } from 'vue'
import { enumerate } from './utils.ts'
import { Manifest } from './schedule.ts'

defineProps<{
  manifest: Manifest | undefined
}>()

const model = defineModel()
</script>

<template>
  <div>
    <label for="semester">Semester:</label>

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

select {
  background: rgb(36, 36, 38);
  color: rgb(229, 229, 234);
  border: 1px solid rgb(72, 72, 74);
  border-radius: 5px;
  padding: 0.1em;
}
</style>
