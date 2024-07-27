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
    <Authenticator>
        <template v-slot="{ user, signOut }">
            <div v-if="user.signInDetails.loginId">
            <h3>Vote as {{ user.signInDetails.loginId }}!</h3>
                <button style="width: 50%;" @click="vote">Vote</button>
            </div>
            <div v-else>
                Sorry, something went wrong, please sign out and log in again.
            </div>
            <button style="width: 50%; margin-top: 2em; background-color: darkgray;" @click="signOut">Not You? Sign Out</button>
        </template>
    </Authenticator>
</template>