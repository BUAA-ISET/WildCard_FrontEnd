<script setup lang="ts">
import { computed, ref } from 'vue'

const roomName = ref('')
const canCreate = computed(() => roomName.value.trim().length > 0)
</script>

<template>
  <section class="room-panel" data-testid="room-create-panel">
    <h2>Create Room</h2>
    <form class="room-form">
      <label for="room-name">Room name</label>
      <input
        id="room-name"
        v-model="roomName"
        data-testid="room-create-input"
        name="roomName"
        placeholder="Enter room name"
        type="text"
      />
      <button :disabled="!canCreate" data-testid="room-create-button" type="button">
        Create Room
      </button>
    </form>
  </section>
</template>
