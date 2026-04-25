<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import RoomCreate from './components/RoomCreate.vue'
import RoomJoin from './components/RoomJoin.vue'

const showTestingSandbox = import.meta.env.VITE_ENABLE_TEST_SANDBOX === 'true'
</script>

<template>
  <main data-testid="app-shell">
    <HelloWorld />

    <section v-if="showTestingSandbox" data-testid="room-testing-sandbox">
      <RoomCreate />
      <RoomJoin />
    </section>
  </main>
</template>
