<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from './stores/userStore'

const userStore = useUserStore()

onMounted(() => {
  void userStore.fetchCurrentUser()
})
</script>

<template>
  <router-view />
</template>
