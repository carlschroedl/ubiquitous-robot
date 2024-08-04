import { defineStorage } from '@aws-amplify/backend';
import { ballotManager } from '../functions/ballot-manager/resource';

export const ballots = defineStorage({
    name: 'ballots',
    access: (allow) => ({
        'ballots/*': [
            allow.resource(ballotManager).to(['read', 'write'])
        ]
    })
})
