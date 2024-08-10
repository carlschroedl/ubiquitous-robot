import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { ScryptOptions, scryptSync } from "crypto";

export enum BallotValidationReason {
    FINE = 'fine',
    TOO_LONG = 'too long',
    MALFORMED = 'malformed',
    EMPTY = 'empty',
}

export interface BallotValidationResult {
    isValid: boolean,
    reason: BallotValidationReason,
}

export const CRAZY_NUMBER_OF_CANDIDATES = 50
export const CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT = 10240
/**
 * Validation results returned by this function could be logged. Since we want
 * to preserve users' privacy, even if logs were leaked, this function does 
 * not return anything directly sourced from the parameterized ballot.
 * 
 * @param ballotString 
 * @returns a privacy-preserving ballot validation result
 */
export function validateBallot(ballotString: string | null): BallotValidationResult {
    if (undefined === ballotString || null === ballotString || 0 === ballotString.length) {
        return {
            isValid: false,
            reason: BallotValidationReason.EMPTY,
        }
    }
    // console.log(ballotString.length)
    if (ballotString.length >= CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT) {
        return {
            isValid: false,
            reason: BallotValidationReason.TOO_LONG,
        }
    } else {
        let parsedBallot = {}
        try {
            parsedBallot = JSON.parse(ballotString)
        } catch {
            return {
                isValid: false,
                reason: BallotValidationReason.MALFORMED,
            }
        }
        return {
            isValid: true,
            reason: BallotValidationReason.FINE,
        }
    }
}

async function writeBallot(ballot: string, bucketName: string, key: string, s3Client: S3Client) {

    const putObjectOptions: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: '/ballots/' + key,
        Body: ballot,
        // ContentType: 'application/json;charset=utf-8;',
    }
    console.log(putObjectOptions)
    const command = new PutObjectCommand(putObjectOptions);
    await s3Client.send(command)
}

/**
 * Do not change the following constants. Doing so would orphan data.
 * More explicitly...
 *  * Users wouldn't be able to retrieve previous ballots
 *  * Users would start storing new ballots to different places
 *  * This could effectively let users vote twice
 * 
 * These are locked to the scrypt parameters recommended by OWASP as of 2024-08-09
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt
 * N=2^15 (32 MiB), r=8 (1024 bytes), p=3
 * 
 */
const DO_NOT_CHANGE_HASH_CONSTANTS: ScryptOptions =
{
    N: 32768,
    r: 8,
    p: 3
}

/**
 * @see DO_NOT_CHANGE_HASH_CONSTANTS
 * Do not change for the same reasons
 */
const DO_NOT_CHANGE_KEY_LENGTH_CONSTANT: number = 32;

/**
 * @see DO_NOT_CHANGE_HASH_CONSTANTS
 * Do not change for the same reasons
 * https://github.com/nodejs/node/issues/21524#issuecomment-2057376635
 */
const DO_NOT_CHANGE_MAXIMUM_MEMORY_CALCULATOR = function (opts: ScryptOptions): number {
    const maxMem = 128 * (opts.p as number) * (opts.r as number) + 128 * (2 + (opts.N as number)) * (opts.r as number)
    return maxMem
}

/**
 * @see DO_NOT_CHANGE_HASH_CONSTANTS
 * Do not change for the same reasons
 */
const DO_NOT_CHANGE_MAXIMUM_MEMORY = DO_NOT_CHANGE_MAXIMUM_MEMORY_CALCULATOR(DO_NOT_CHANGE_HASH_CONSTANTS)

/**
 * This function produces a key that is hard to reverse by securely hashing
 * the user id after peppering it. That way, if ballots are leaked, but the 
 * pepper remains a secret, there is a non-trivial memory and CPU cost to
 * associating ballots with users' identities
 * @param userId 
 * @param pepper
 * @returns secure string key
 */
export function getSecureKey(userId: string, pepper: string): string {
    const salt = pepper // this is OK -- we are not storing the plaintext salt
    const hash = scryptSync(
        userId,
        salt,
        DO_NOT_CHANGE_KEY_LENGTH_CONSTANT,
        {
            ...DO_NOT_CHANGE_HASH_CONSTANTS,
            maxmem: DO_NOT_CHANGE_MAXIMUM_MEMORY
        }
    )
    const key = hash.toString('hex')
    return key
}


export class InvalidPepperError extends Error {
    public static MESSAGE_PREFIX = 'Invalid Pepper - '
    constructor(message: string, options?: any) {
        super(InvalidPepperError.MESSAGE_PREFIX + message, options)
    }
}

export const PEPPER_MINIMUM_LENGTH = 32

export enum PepperValidationReason {
    EMPTY = 'Empty',
    TOO_SHORT = 'Too Short',
    FINE = 'Fine'
}

export interface PepperValidation {
    isValid: boolean,
    reason: PepperValidationReason,
}
/**
 * Since TypeScript only performs compile-time checks, we perform critical
 * validations at runtime
 * @param pepper 
 * @returns 
 */
export function validatePepper(pepper: string | undefined | null): PepperValidation {
    if (undefined === pepper || null === pepper || 0 === pepper.length) {
        return {
            isValid: false,
            reason: PepperValidationReason.EMPTY,
        }
    } else if (pepper.length < 32) {
        return {
            isValid: false,
            reason: PepperValidationReason.TOO_SHORT,
        }
    } else {
        return {
            isValid: true,
            reason: PepperValidationReason.FINE
        }
    }
}

export const USER_ID_MAX_LENGTH = 1024
export const USER_ID_MIN_LENGTH = 5

export enum UserIdValidationReason {
    FINE = 'Fine',
    EMPTY = 'Empty',
    TOO_LONG = 'Too Long',
    TOO_SHORT = 'Too Short',
}

export interface UserIdValidationResult {
    isValid: boolean,
    reason: UserIdValidationReason,
}

export function validateUserId(userId: string | null | undefined): UserIdValidationResult {
    if (null === userId || undefined === userId || 0 === userId.length) {
        return {
            isValid: false,
            reason: UserIdValidationReason.EMPTY
        }
    } else if (userId.length > USER_ID_MAX_LENGTH) {
        return {
            isValid: false,
            reason: UserIdValidationReason.TOO_LONG,
        }
    } else if (userId.length < USER_ID_MIN_LENGTH) {
        return {
            isValid: false,
            reason: UserIdValidationReason.TOO_SHORT
        }
    } else {
        return {
            isValid: true,
            reason: UserIdValidationReason.FINE
        }
    }
}

/**
 * Entrypoint for all ballot management logic except :
 *  - reading HTTP and API Gateway request info
 *  - constructing HTTP responses
 * Prevent any sensitive info from being incorporated
 * into responses to the user by catching all errors and performing all 
 * relevant logging here
 * 
 * @param ballot 
 * @param email 
 * @param ballotsS3BucketName 
 * @param s3Client
 * @param pepper 
 * @returns true if successful, false otherwise
 */
export async function main(ballot: string, email: string, ballotsS3BucketName: string, s3Client: S3Client, pepper: string): Promise<boolean> {
    try {
        const userIdValidationResult = validateUserId(email)
        if (!userIdValidationResult.isValid) {
            throw new Error(`Invalid user. USER:'${email}' REASON:'${userIdValidationResult.reason}'`)
        }
        const ballotValidationResult = validateBallot(ballot)
        if (!ballotValidationResult.isValid) {
            throw new Error(`Invalid ballot. USER:'${email}' REASON:'${ballotValidationResult.reason}'`)
        }

        const key = getSecureKey(email, pepper)

        await writeBallot(ballot, ballotsS3BucketName, key, s3Client)
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}