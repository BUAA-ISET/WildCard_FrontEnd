<script setup lang="ts">
import RoomCreate from './RoomCreate.vue'
import RoomJoin from './RoomJoin.vue'
</script>

<template>
  <main class="testing-sandbox" data-testid="room-testing-sandbox">
    <RoomCreate />
    <RoomJoin />
  </main>
</template>

<style scoped>
.testing-sandbox {
  display: grid;
  gap: 16px;
  padding: 32px;
}
</style>
