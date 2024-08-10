import { expect, test, describe, vi } from 'vitest'
import { S3Client, PutObjectOutput } from '@aws-sdk/client-s3';
import { getSecureKey, InvalidPepperError, validatePepper, validateBallot, BallotValidationReason, CRAZY_NUMBER_OF_CANDIDATES, CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT, main, validateUserId, UserIdValidationReason, USER_ID_MAX_LENGTH, USER_ID_MIN_LENGTH } from './service'

describe('getSecureKey()', () => {
  test('Regression Test', () => {
    const expected = 'de938700f4b71a42929d8345683155af9f9db72c2e89fe6c0c83f7b6ff5cc9fe'
    const testInput = 'myUser'
    const testPepper = 'black'
    const actual = getSecureKey(testInput, testPepper)
    const LOUD_ERROR_MESSAGE = `
        USER DATA IS GOING TO BE ORPHANED AND/OR USERS WILL BE ABLE TO VOTE TWICE
        PLEASE RESTORE PREVIOUS HASH FUNCTION CONSTANT VALUES
      `
    expect(actual, LOUD_ERROR_MESSAGE).toBe(expected)
  })
})

describe('validatePepper()', () => {
  test('Should throw error if null', () => {
    // @ts-ignore
    expect(() => validatePepper(null)).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should throw error if undefined', () => {
    // @ts-ignore
    expect(() => validatePepper(undefined)).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should throw error if a number', () => {
    // @ts-ignore
    expect(() => validatePepper(32)).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should throw error if an array', () => {
    // @ts-ignore
    expect(() => validatePepper([])).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should throw error if an object', () => {
    // @ts-ignore
    expect(() => validatePepper([])).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should throw error if a function', () => {
    // @ts-ignore
    expect(() => validatePepper(() => { })).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should throw error if blank', () => {
    expect(() => validatePepper('')).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should throw error if 31 chars', () => {
    const THIRTY_ONE_CHARS = '0'.repeat(31)
    expect(() => validatePepper(THIRTY_ONE_CHARS)).toThrow(InvalidPepperError.MESSAGE_PREFIX)
  })
  test('Should return true if 32 chars', () => {
    const THIRTY_TWO_CHARS = '0'.repeat(32)
    expect(validatePepper(THIRTY_TWO_CHARS)).toBe(true)
  })
  test('Should return true if 33 chars', () => {
    const THIRTY_TWO_CHARS = '0'.repeat(33)
    expect(validatePepper(THIRTY_TWO_CHARS)).toBe(true)
  })
})

describe('validateBallot()', () => {
  test('null is invalid', () => {
    expect(validateBallot(null)).toEqual({
      isValid: false,
      reason: BallotValidationReason.EMPTY,
    })
  })
  test('undefined is invalid', () => {
    // @ts-ignore
    expect(validateBallot(undefined)).toEqual({
      isValid: false,
      reason: BallotValidationReason.EMPTY,
    })
  })
  test('too many characters is invalid', () => {
    const input = '0'.repeat(CRAZY_NUMBER_OF_CHARACTERS_FOR_A_BALLOT)
    expect(validateBallot(input)).toEqual({
      isValid: false,
      reason: BallotValidationReason.TOO_LONG,
    })
  })
  test('malformed JSON is invalid', () => {
    const input = '{]}'
    expect(validateBallot(input)).toEqual({
      isValid: false,
      reason: BallotValidationReason.MALFORMED,
    })
  })
  test('legit JSON is OK', () => {
    const input = '{"a": 1}'
    expect(validateBallot(input)).toEqual({
      isValid: true,
      reason: BallotValidationReason.FINE,
    })
  })
})

describe('validateUserId()', () => {
  test('null is invalid', () => {
    expect(validateUserId(null)).toEqual({
      isValid: false,
      reason: UserIdValidationReason.EMPTY,
    })
  })
  test('undefined is invalid', () => {
    // @ts-ignore
    expect(validateUserId(undefined)).toEqual({
      isValid: false,
      reason: UserIdValidationReason.EMPTY,
    })
  })
  test('blank is invalid', () => {
    // @ts-ignore
    expect(validateUserId('')).toEqual({
      isValid: false,
      reason: UserIdValidationReason.EMPTY,
    })
  })
  test('too many characters is invalid', () => {
    const input = '0'.repeat(USER_ID_MAX_LENGTH + 1)
    expect(validateUserId(input)).toEqual({
      isValid: false,
      reason: UserIdValidationReason.TOO_LONG,
    })
  })
  test('the max number of characters is valid', () => {
    const input = '0'.repeat(USER_ID_MAX_LENGTH)
    expect(validateUserId(input)).toEqual({
      isValid: true,
      reason: UserIdValidationReason.FINE,
    })
  })
  test('too few characters is invalid', () => {
    const input = '0'.repeat(USER_ID_MIN_LENGTH - 1)
    expect(validateUserId(input)).toEqual({
      isValid: false,
      reason: UserIdValidationReason.TOO_SHORT,
    })
  })
  test('the min characters is valid', () => {
    const input = '0'.repeat(USER_ID_MIN_LENGTH)
    expect(validateUserId(input)).toEqual({
      isValid: true,
      reason: UserIdValidationReason.FINE,
    })
  })
  test('email address is OK', () => {
    const input = 'voter@internet.universe'
    expect(validateUserId(input)).toEqual({
      isValid: true,
      reason: UserIdValidationReason.FINE,
    })
  })
})

describe('main', () => {
  const noOpMockS3Client = ({
    send: async () => {
      return true
    },
  } as unknown) as S3Client

  test('empty ballot fails', async () => {
    const emptyBallot = ''
    const result = await main(emptyBallot, 'email@', 'bucketName', noOpMockS3Client, 'pepper')
    expect(result).toBe(false)
  })
  test('good ballot succeeds', async () => {
    const goodBallot = '{"a":1}'
    const result = await main(goodBallot, 'email', 'bucketName', noOpMockS3Client, 'pepper')
    expect(result).toBe(true)
  })
  test('empty user fails', async () => {
    const goodBallot = '{"a":1}'
    const emptyUser = ''
    const result = await main(goodBallot, emptyUser, 'bucketName', noOpMockS3Client, 'pepper')
    expect(result).toBe(false)
  })
  test('good ballot succeeds', async () => {
    const goodBallot = '{"a":1}'
    const result = await main(goodBallot, 'email', 'bucketName', noOpMockS3Client, 'pepper')
    expect(result).toBe(true)
  })
  test('bad s3 operation fails', async () => {
    const goodBallot = '{"a":1}'
    const failingS3ClientMock = ({
      send: async () => {
        throw new Error('S3 Error')
      },
    } as unknown) as S3Client
    const result = await main(goodBallot, 'email', 'bucketName', failingS3ClientMock, 'pepper')
    expect(result).toBe(false)
  })
})
