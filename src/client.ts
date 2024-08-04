import { fetchAuthSession } from 'aws-amplify/auth'
import { put } from 'aws-amplify/api';

export default {
    models: {
        Ballot: {
            upsert: async function (ballot: object) {
                const session = await fetchAuthSession();
                const tokens = session.tokens
                if (undefined === tokens || undefined === tokens?.idToken) {
                    throw Error('empty token(s)')
                } else {
                    const token = tokens.idToken
                    try {
                        const restOperation = put({
                            apiName: 'ballot-management',
                            path: 'ballot',
                            options: {
                                headers: {
                                    'Authorization': token.toString()
                                },
                                body: JSON.stringify(ballot),
                            },
                        });
                        const response = await restOperation.response
                        console.log('PUT call succeeded: ', response)
                        return response.body.json()
                    } catch (error: any) {
                        console.log('PUT call failed: ', JSON.parse(error?.response?.body));
                    }
                }
            },
        },
        Candidate: {
            list: async function () {
                return [{
                    id: '42',
                    name: 'zoinks',
                },
                {
                    id: '99',
                    name: 'jinkies',
                },
                {
                    id: '1',
                    name: 'scoob',
                },
                ]
            }
        }
    }
}