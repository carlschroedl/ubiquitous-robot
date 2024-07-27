<script setup lang="ts">
import '@/assets/main.css';
import { RouterLink } from 'vue-router';

</script>

<template>
    <h1>Make your vote count!</h1>
    <p>To ensure you are a real person, create an account, or log in with an existing one.</p>
    <RouterLink to="/submit"><button>Log in, vote</button></RouterLink>
    <RouterLink to="/results"><button>Don't vote, skip to the results</button></RouterLink>
    <p>You can view results and learn how we tally them either way</p>
</template>