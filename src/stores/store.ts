import { defineStore } from 'pinia'
import type { ClientSideRanking } from '../ClientSideTypes'

interface StateData {
    rankings: Array<ClientSideRanking>
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