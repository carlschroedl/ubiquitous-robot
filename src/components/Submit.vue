<script setup lang="ts">
import "@aws-amplify/ui-vue/styles.css"
import { Authenticator } from "@aws-amplify/ui-vue"
import { useRouter } from 'vue-router'
import '@/assets/main.css';
import { onMounted, ref, reactive } from 'vue';
import draggable from 'vuedraggable'
import { useStore } from '@/stores/store'
import type { ClientSideRanking } from '@/ClientSideTypes';
import { RouterLink } from 'vue-router';
import { electionId } from '../constants'
import client from '../client'
const store = useStore()
const router = useRouter()
async function vote() {
    const response = await client.models.Ballot.upsert({})
    console.dir(response)
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
            <button style="width: 50%; margin-top: 2em; background-color: darkgray;" @click="signOut">Not You? Sign
                Out</button>
        </template>
    </Authenticator>
</template>