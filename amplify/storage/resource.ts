import { defineStorage } from '@aws-amplify/backend';
import { ballotManager } from '../functions/ballot-manager/resource';

export const storage = defineStorage({
    name: 'ballots',
    access: (allow) => ({
        'ballots/*': [
            allow.resource(ballotManager).to(['read', 'write', 'delete'])
        ]
    })
})
