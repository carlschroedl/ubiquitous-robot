<script setup lang="ts">
import "@aws-amplify/ui-vue/styles.css"
import { Authenticator } from "@aws-amplify/ui-vue"
import { useRouter } from 'vue-router'
const router = useRouter()
async function vote () {
    console.log("todo")
    router.push("/results")
}

</script>

<template>
    <h1>Submit</h1>
    <Authenticator>
        <template v-slot="{ user, signOut }">
            <div v-if="user.signInDetails.loginId">
            <h2>Vote as {{ user.signInDetails.loginId }}!</h2>
            <button @click="vote">Vote</button>
            </div>
            <div v-else>
                Sorry, something went wrong, please Sign Out and try logging in again.
            </div>
            <button @click="signOut">Not You? Sign Out</button>
        </template>
    </Authenticator>
</template>