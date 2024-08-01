import type { APIGatewayProxyHandler, APIGatewayProxyEvent, Context } from "aws-lambda";
import { env } from '$amplify/env/ballot-manager'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { scrypt } from 'crypto'
import { scryptSync } from "crypto";
import { ballots } from "../../storage/resource";

/**
 * Do not change the following constants. Doing so would orphan data.
 * More explicitly...
 *  * Users wouldn't be able to retrieve previous ballots
 *  * Users would start storing new ballots to different places
 *  * This could effectively let users vote twice
 * 
 * These are locked to the scrypt parameters recommended by OWASP as of 07-31-2024
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt
 * N=2^16 (64 MiB), r=8 (1024 bytes), p=2
 * 
 */
const DO_NOT_CHANGE_HASH_CONSTANTS =
{
  N: 2 ** 16,
  r: 8,
  p: 2,
}

function validatePepper(pepper: string): boolean {
  if (undefined === pepper || null === pepper) {
    throw Error('You must define a secret named PEPPER. https://docs.amplify.aws/vue/build-a-backend/functions/environment-variables-and-secrets/#secrets')
  } else if (typeof pepper !== 'string') {
    throw Error('The secret named PEPPER must be a string. https://docs.amplify.aws/vue/build-a-backend/functions/environment-variables-and-secrets/#secrets')
  } else if (pepper.length < 32) {
    throw Error('The secret named PEPPER must be at least 32 characters long. https://docs.amplify.aws/vue/build-a-backend/functions/environment-variables-and-secrets/#secrets')
  } else {
    return true
  }
}
// during startup, validate pepper
validatePepper(env.PEPPER)

/**
 * This function produces a key that is hard to reverse by securely hashing
 * the user id after peppering it. That way, if ballots are leaked, but the 
 * pepper remains a secret, there is a non-trivial memory and CPU cost to
 * associating ballots with users' identities
 * @param userId 
 * @returns secure string key
 */
function getSecureKey(userId: string): string {
  const salt = env.PEPPER
  const hash = scryptSync(userId, salt, 64,)
  const key = hash.toString('hex')
  return key
}
const s3Client = new S3Client();

enum ValidationReason {
  FINE='fine',
  TOO_LONG='too long',
  MALFORMED='malformed',
  EMPTY='empty',
}


interface ValidationResult {
  isValid: boolean,
  reason: ValidationReason,
}

const CRAZY_NUMBER_OF_CANDIDATES = 50
const CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT = 1024
function validateBallot(ballotString: string | null): ValidationResult {
  if (undefined === ballotString || null === ballotString || 0 === ballotString.length) {
    return {
      isValid: false,
      reason: ValidationReason.EMPTY,
    }
  }
  if (ballotString.length >= CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT) {
    return {
      isValid: false,
      reason: ValidationReason.TOO_LONG,
    }
  } else {
    let parsedBallot = {}
    try {
      parsedBallot = JSON.parse(ballotString)
    } catch {
      return {
        isValid: false,
        reason: ValidationReason.MALFORMED,
      }
    }
    if (Object.keys(parsedBallot).length >= CRAZY_NUMBER_OF_CANDIDATES) {
      return {
        isValid: false,
        reason: ValidationReason.TOO_LONG,
      }
    } else {
      return {
        isValid: true,
        reason: ValidationReason.FINE,
      }
    }
  }
}

async function writeBallot(key: string, ballot: string) {
  const command = new PutObjectCommand({
    Bucket: env.BALLOTS_BUCKET_NAME,
    Key: '/ballots/' + key,
    Body: ballot,
    ContentType: 'application/json;charset=utf-8;',
  });

  return await s3Client.send(command);
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log("event", event);
  const email = event.requestContext?.authorizer?.claims.email
  if (null === email || undefined === email || '' === email) {
    throw Error('User identity missing from request')
  } else {
    const validationResult = validateBallot(event.body)
    if (!validationResult.isValid) {
      throw Error(`Invalid ballot. USER:'${email}' REASON:'${validationResult.reason}'`)
    }

    const key = getSecureKey(email)
    await writeBallot(key, event.body as string)
    
    return {
      statusCode: 200,
      body: '',
      // Modify the CORS settings below to match your specific requirements
      headers: {
        "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
        "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
      },
    };
  }





};