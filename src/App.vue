<script setup lang="ts">
import '@/assets/main.css';
</script>

<template>
  <main>
    <h1>Rank the Race!</h1>
  <!-- <nav>
    <ul>
      <li><RouterLink to="/">Vote!</RouterLink></li>
      <li><RouterLink to="/results">Results!</RouterLink></li>
    </ul>
  </nav> -->
  <main>
    <div style="width: 90%; min-width: 800px; margin: auto;">
      <RouterView />
    </div>
  </main>


  </main>
</template>

