import type { APIGatewayProxyHandler, APIGatewayProxyEvent, Context} from "aws-lambda";
import argon2 from 'argon2'
import { env } from '$amplify/env/ballot-manager'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Do not change the following constants. Doing so would orphan data.
 * More explicitly...
 *  * Users wouldn't be able to retrieve previous ballots
 *  * Users would start storing new ballots to different places
 *  * This could effectively let users vote twice
 * 
 * These are locked to the default values mentioned here as of 2024-07-28
 * https://github.com/ranisalt/node-argon2/wiki/Options/d1f51247ffb0761c1e7e18b2f6847fb1367d0b1f
 * 
 */
const DO_NOT_CHANGE_HASH_CONSTANTS = {
  type: argon2.argon2id,
  hashLength: 32,
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 4,
  saltLength: 16,
  version: 0x13,
}

function getHashParams(pepper: string) {
  if (undefined === pepper || null === pepper) {
    throw Error('You must define a secret named PEPPER. https://docs.amplify.aws/vue/build-a-backend/functions/environment-variables-and-secrets/#secrets')
  } else if (typeof pepper !== 'string' || !((pepper as any) instanceof String)) {
    throw Error('The secret named PEPPER must be a string. https://docs.amplify.aws/vue/build-a-backend/functions/environment-variables-and-secrets/#secrets')
  } else if (pepper.length < 32) {
    throw Error('The secret named PEPPER must be at least 32 characters long. https://docs.amplify.aws/vue/build-a-backend/functions/environment-variables-and-secrets/#secrets')
  } else {
    const pepperAsBuffer = Buffer.from(pepper)
    const hashParams = {
      ...DO_NOT_CHANGE_HASH_CONSTANTS,
      secret: pepperAsBuffer,
    }
    return hashParams
  }
}


async function hash(userId: string) {
  const hashParams = getHashParams(env.PEPPER)
  const hash = await argon2.hash(userId, hashParams);
  return hash
}
const s3Client = new S3Client();

async function writeBallot(key: string, ballot: object) {
  const command = new PutObjectCommand({
    Bucket: env.BALLOTS_BUCKET_NAME,
    Key: '/ballots/' + key,
    Body: new Blob([''], { type: 'text/csv;charset=utf-8;' })
  });

  return await s3Client.send(command);
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log("event", event);
  const email = event.requestContext?.authorizer?.claims.email
  if (null === email || undefined === email || '' === email) {
    throw Error('User identity missing from request')
  } else {
    const hashedEmail = await hash(email)
    const key = encodeURIComponent(hashedEmail)
    const body = JSON.stringify({
      email,
      hashed: hashedEmail,
      key,
    })
    return {
      statusCode: 200,
      // Modify the CORS settings below to match your specific requirements
      headers: {
        "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
        "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
      },
      body,
    };
  }
    
  


  
};