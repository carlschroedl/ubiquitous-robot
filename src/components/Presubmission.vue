<script setup lang="ts">
import '@/assets/main.css';
import { RouterLink } from 'vue-router';

</script>

<template>
    <h2>Make Your Vote Count!</h2>
        <p>If you want to submit your ranked ballot, please create an account, or log in with an account you already
            have.
            This ensures you are a real person.</p>
        <RouterLink to="/submit"><button style="width: 50%;">Log In & Vote</button></RouterLink>
        <p>If you'd rather not, you can still view the results and learn about better tallying.</p>
        <RouterLink to="/results"><button style="width: 50%; margin-top: 1em; background-color: darkgray;">Don't Vote
                &mdash; Skip to Results</button></RouterLink>
</template>
