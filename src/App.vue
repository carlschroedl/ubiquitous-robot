<script setup lang="ts">
import { Authenticator } from "@aws-amplify/ui-vue"
import "@aws-amplify/ui-vue/styles.css"
import Ranking from './components/Ranking.vue'
</script>

<template>
  <main>
    <Authenticator>
      <template v-slot="{ signOut }">
        <Ranking />
        <button @click="signOut">Sign Out</button>
      </template>
    </Authenticator>
  </main>
</template>

