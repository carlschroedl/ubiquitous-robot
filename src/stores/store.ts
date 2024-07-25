import { defineStore } from 'pinia'
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<Schema>();
type Election = Schema['Election']['type']
type Ranking = Schema['Ranking']['type']
type Candidate = Schema['Candidate']['type']
type Ballot = Schema['Ballot']['type']

interface StateData {
    rankings: Array<Ranking>
}

export const useStore = defineStore('store', {
  state: () => {
    const theState : StateData = {
      rankings: [] ,
    }
    return theState
  },
  actions: {
    setRankings(rankings: Array<ClientSideRanking>) {
      this.rankings = rankings
    },
  },
})