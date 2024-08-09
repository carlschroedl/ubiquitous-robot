import type { APIGatewayProxyHandler, APIGatewayProxyEvent, Context } from "aws-lambda";
import { env } from '$amplify/env/ballot-manager'
import { S3Client } from '@aws-sdk/client-s3';
import { validatePepper, main } from './service'


// during startup
validatePepper(env.PEPPER)
const s3Client = new S3Client();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log("event", event);
  const email = event.requestContext?.authorizer?.claims.email
  if (null === email || undefined === email || '' === email) {
    throw Error('User identity missing from request')
  } else {
    
    main(event.body as string, email, env.BALLOTS_BUCKET_NAME, s3Client, env.PEPPER)
    return {
      statusCode: 200,
      body: '',
      // Modify the CORS settings below to match your specific requirements
      headers: {
        "Access-Control-Allow-Origin": "*", // TODO: restrict. event.requestContext.domainName ?
        "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
      },
    };
  }
};