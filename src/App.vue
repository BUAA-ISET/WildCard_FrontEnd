<script setup lang="ts">
import MainLayout from './components/MainLayout.vue'
import RoomCreate from './components/RoomCreate.vue'
import RoomJoin from './components/RoomJoin.vue'

const showTestingSandbox = import.meta.env.VITE_ENABLE_TEST_SANDBOX === 'true'
</script>

<template>
  <main data-testid="app-shell">
    <MainLayout />

    <section
      v-if="showTestingSandbox"
      class="testing-sandbox"
      data-testid="room-testing-sandbox"
    >
      <RoomCreate />
      <RoomJoin />
    </section>
  </main>
</template>

<style scoped>
.testing-sandbox {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1000;
  display: grid;
  gap: 12px;
  width: min(320px, calc(100vw - 32px));
}
</style>
