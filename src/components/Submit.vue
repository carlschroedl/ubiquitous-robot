<script setup lang="ts">
import "@aws-amplify/ui-vue/styles.css"
import { Authenticator } from "@aws-amplify/ui-vue"
import { useRouter } from 'vue-router'
import '@/assets/main.css';
import { onMounted, ref, reactive } from 'vue';
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import draggable from 'vuedraggable'
import { useStore } from '@/stores/store'
import type { ClientSideRanking } from '@/ClientSideTypes';
import { RouterLink } from 'vue-router';
import { electionId } from '../constants'
const store = useStore()

const client = generateClient<Schema>();
type Election = Schema['Election']['type']
type Ranking = Schema['Ranking']['type']
type Candidate = Schema['Candidate']['type']
type Ballot = Schema['Ballot']['type']

const router = useRouter()

async function deletePastBallots() {
    const { data: existingBallots } = await client.models.Ballot.list({
        filter: {
            electionId: {
                eq: electionId,
            }
        }
    })
    existingBallots.forEach(async (existingBallot) => {
        const { data: existingRankings } = await client.models.Ranking.list({
            filter: {
                ballotId: {
                    eq: existingBallot.id
                }
            }
        })
        existingRankings.forEach(async (existingRanking) => {
            await client.models.Ranking.delete({ id: existingRanking.id })
        })
        await client.models.Ballot.delete({ id: existingBallot.id })
    })
}

async function submitNewBallotAndRankings(rankings: ClientSideRanking[]) {
    const response = await client.models.Ballot.create({
        electionId,
    })
    const ballot = response.data
    if (null === ballot) {
        throw 'Error creating ballot';
    } else {
        const ballotId = ballot.id
        rankings.forEach(async (ranking, index) => {
            await client.models.Ranking.create({
                ballotId: ballotId,
                candidateId: ranking.candidateId,
                rank: index,
            })
        })
    }
}

async function vote() {
    await deletePastBallots()
    await submitNewBallotAndRankings(store.rankings)
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