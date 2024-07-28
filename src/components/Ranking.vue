<script setup lang="ts">
import '@/assets/main.css';
import { onMounted, ref, reactive } from 'vue';
import draggable from 'vuedraggable'
import { useStore } from '@/stores/store'
import type { ClientSideRanking } from '@/ClientSideTypes';
import { RouterLink } from 'vue-router';
import { electionId } from '../constants'
import client from '../client'

const store = useStore()

async function _initialize() {

  const candidates = await client.models.Candidate.list()

  const tempRankings: Array<ClientSideRanking> =
    candidates.map((candidate) => {
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        rank: Math.random(),  //float. Will need to integerize and coalesce
      }
    }).sort((rankingA: ClientSideRanking, rankingB: ClientSideRanking) => {
      return rankingA.rank - rankingB.rank;
    }).map((ranking, index) => {
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
    <p>The way we vote, and the way we tally ballots forces us to pick the lesser of two evils.</p>
    <h3>There is a better way!</h3>
    <h3>Step 1: Better Ballots</h3>
    <p>Don't just pick one candidate, rank them all!</p>
    <p>Drag and drop</p>
    <div class="clarifier">(Best)</div>
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
    <div class="clarifier">(Worst)</div>
    <RouterLink to="/presubmission">
      <button style="width: 50%; margin:auto;">Go to Step 2: Better Tallying</button>
    </RouterLink>
  </main>
</template>
