import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { scrypt } from 'crypto'
import { scryptSync } from "crypto";
import { ballots } from "../../storage/resource";

enum ValidationReason {
    FINE = 'fine',
    TOO_LONG = 'too long',
    MALFORMED = 'malformed',
    EMPTY = 'empty',
}


interface ValidationResult {
    isValid: boolean,
    reason: ValidationReason,
}

const CRAZY_NUMBER_OF_CANDIDATES = 50
const CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT = 10240
function validateBallot(ballotString: string | null): ValidationResult {
    return {
        isValid: true,
        reason: ValidationReason.FINE,
    }
    // console.log(`Validating ballot: ${ballotString}}`)
    // if (undefined === ballotString || null === ballotString || 0 === ballotString.length) {
    //   return {
    //     isValid: false,
    //     reason: ValidationReason.EMPTY,
    //   }
    // }
    // console.log(ballotString.length)
    // if (ballotString.length >= CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT) {
    //   return {
    //     isValid: false,
    //     reason: ValidationReason.TOO_LONG,
    //   }
    // } else {
    //   let parsedBallot = {}
    //   try {
    //     parsedBallot = JSON.parse(ballotString)
    //   } catch {
    //     return {
    //       isValid: false,
    //       reason: ValidationReason.MALFORMED,
    //     }
    //   }
    //   console.log(Object.keys(parsedBallot).length)
    //   if (Object.keys(parsedBallot).length >= CRAZY_NUMBER_OF_CANDIDATES) {
    //     return {
    //       isValid: false,
    //       reason: ValidationReason.TOO_LONG,
    //     }
    //   } else {
    //     return {
    //       isValid: true,
    //       reason: ValidationReason.FINE,
    //     }
    //   }
    // }
}

async function writeBallot(ballot: string, bucketName: string, key: string,s3Client: S3Client) {

    const putObjectOptions: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: '/ballots/' + key,
        Body: ballot,
        // ContentType: 'application/json;charset=utf-8;',
    }
    console.log(putObjectOptions)
    const command = new PutObjectCommand(putObjectOptions);

    return await s3Client.send(command);
}

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


/**
 * This function produces a key that is hard to reverse by securely hashing
 * the user id after peppering it. That way, if ballots are leaked, but the 
 * pepper remains a secret, there is a non-trivial memory and CPU cost to
 * associating ballots with users' identities
 * @param userId 
 * @param pepper
 * @returns secure string key
 */
function getSecureKey(userId: string, pepper: string): string {
    const salt = pepper
    const hash = scryptSync(userId, salt, 64, DO_NOT_CHANGE_HASH_CONSTANTS)
    const key = hash.toString('hex')
    return key
}


export function validatePepper(pepper: string): boolean {
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

export async function main(ballot: string, email: string, ballotsS3BucketName: string, s3Client: S3Client, pepper: string) {
    const validationResult = validateBallot(ballot)
    if (!validationResult.isValid) {
        throw Error(`Invalid ballot. USER:'${email}' REASON:'${validationResult.reason}'`)
    }

    const key = getSecureKey(email, pepper)
    await writeBallot(ballot, ballotsS3BucketName, key, s3Client)
}