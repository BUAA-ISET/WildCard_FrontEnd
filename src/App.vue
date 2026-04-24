<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import RoomCreate from './components/RoomCreate.vue'
import RoomJoin from './components/RoomJoin.vue'
</script>

<template>
  <main data-testid="app-shell">
    <HelloWorld />

    <section data-testid="room-testing-sandbox">
      <RoomCreate />
      <RoomJoin />
    </section>
  </main>
</template>
