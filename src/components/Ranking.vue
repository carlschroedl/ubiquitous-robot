<script setup lang="ts">
import '@/assets/main.css';
import { onMounted, ref, reactive } from 'vue';
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import draggable from 'vuedraggable'
import { useStore } from '@/stores/store'
import type { ClientSideRanking } from '@/ClientSideTypes';
import { RouterLink } from 'vue-router';
const store = useStore()

const client = generateClient<Schema>();
type Election = Schema['Election']['type']
type Ranking = Schema['Ranking']['type']
type Candidate = Schema['Candidate']['type']
type Ballot = Schema['Ballot']['type']

const electionId = 'e0f02f9f-f9c6-40ee-89b4-819f225a49e3'

async function _initialize() {

  const { data: election } = await client.models.Election.get({ id: electionId })
  const { data: candidates } = await client.models.Candidate.list({
    filter: {
      electionId: {
        eq: electionId,
      }
    }
  })

  // const {data: ballots} = await client.models.Ballot.list({
  //   filter: {
  //     electionId: {
  //       eq: electionId,
  //     } 
  //   }
  // })
  // async function createBallot(rankings: Array<Object>)

  const tempRankings: Array<ClientSideRanking> =
    candidates.map((candidate) => {
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        rank: Math.random(),  //float. Will need to integerize and coalesce
      }
    }).sort((rankingA: ClientSideRanking, rankingB: ClientSideRanking) => {
      return rankingA.rank - rankingB.rank;
    })
      .map((ranking, index) => {
        // integerize, coalesce rank values
        return {
          ...ranking,
          rank: index,
        }
      })

  store.setRankings(tempRankings)
}

// create a reactive reference to the array of todos
const drag = ref<Boolean>(false)


onMounted(() => {
  _initialize() 
});

</script>

<template>
  <main>
    <h1>My Ballot</h1>
    <ul>
      <draggable v-model="store.rankings" group="things" item-key="id" @start="drag = true" @false="drag = false">
        <template #item="{ element }">
          <li style="display: grid; grid-template-columns: 1fr auto; align-items: center;">
            <span>
              {{ element.candidateName }}
            </span>
          </li>
        </template>
      </draggable>
    </ul>
    <RouterLink to="/presubmission">
      <button>Submit</button>
    </RouterLink>
  </main>
</template>
