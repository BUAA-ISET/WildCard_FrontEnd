<script setup lang="ts">
import { computed, ref } from 'vue'

const roomCode = ref('')
const canJoin = computed(() => roomCode.value.trim().length >= 4)
</script>

<template>
  <section class="room-panel" data-testid="room-join-panel">
    <h2>Join Room</h2>
    <form class="room-form">
      <label for="room-code">Room code</label>
      <input
        id="room-code"
        v-model="roomCode"
        data-testid="room-join-input"
        name="roomCode"
        placeholder="Enter room code"
        type="text"
      />
      <button
        :disabled="!canJoin"
        data-testid="room-join-button"
        type="button"
      >
        Join Room
      </button>
    </form>
  </section>
</template>
