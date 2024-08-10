import type { APIGatewayProxyHandler, APIGatewayProxyEvent, Context } from "aws-lambda";
import { env } from '$amplify/env/ballot-manager'
import { S3Client } from '@aws-sdk/client-s3';
import { validatePepper, main } from './service'


// during startup
validatePepper(env.PEPPER)
const s3Client = new S3Client();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // TODO: restrict. event.requestContext.domainName ?
  "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
}
const ERROR_RESPONSE = {
  statusCode: 500,
  body: '', // disclose as little information as possible
  headers: {
    ...CORS_HEADERS
  },
}
const SUCCESS_RESPONSE = {
  statusCode: 200,
  body: '', // disclose as little information as possible
  headers: {
    ...CORS_HEADERS
  },
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log("event", event);
  
  try {
    const email = event.requestContext?.authorizer?.claims.email
    const success = await main(event.body as string, email, env.BALLOTS_BUCKET_NAME, s3Client, env.PEPPER)
    if (success) {
      return SUCCESS_RESPONSE
    } else {
      return ERROR_RESPONSE
    }
  } catch (e) {
    console.error(e)
    return ERROR_RESPONSE
  }
};