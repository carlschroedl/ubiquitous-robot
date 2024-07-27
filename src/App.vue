<script setup lang="ts">
import '@/assets/main.css';
</script>

<template>
  <main>
    <h1>Rank the Race!</h1>
  <p>
    <strong>Current route path:</strong> {{ $route.fullPath }}
  </p>
  <nav>
    <RouterLink to="/">Vote!</RouterLink>
    <RouterLink to="/results">Results!</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>


  </main>
</template>

