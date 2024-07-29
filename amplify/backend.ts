import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ballotManager } from "./functions/ballot-manager/resource";
import { auth } from "./auth/resource";

import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

import { ballots } from './storage/resource';
import { CloudFrontWebDistribution } from "aws-cdk-lib/aws-cloudfront";

const backend = defineBackend({
  auth,
  ballots,
  ballotManager,
});

// create a new API stack
const apiStack = backend.createStack("api-stack");

const staticHosting = new CloudFrontWebDistribution(apiStack, 'StaticHosting', {
  originConfigs: [
    {
      s3OriginSource: {
        s3BucketSource: backend.ballots.resources.bucket
      },
      behaviors : [ {isDefaultBehavior: true} ],
    },
  ]
});

// create a new REST API
const ballotManagerApi = new RestApi(apiStack, "RestApi", {
  restApiName: "ballot-management",
  deploy: true,
  deployOptions: {
    stageName: "production",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.ballotManager.resources.lambda
);

// create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const ballotResource = ballotManagerApi.root.addResource("ballot");
ballotResource.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});
ballotResource.addMethod("PUT", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${ballotManagerApi.arnForExecuteApi("GET", "/ballot", "production")}`,
        `${ballotManagerApi.arnForExecuteApi("PUT", "/ballot", "production")}`
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// console.log('lambda env')
// console.dir(backend.ballotManager.resources.cfnResources.cfnFunction.environment)
// if ( undefined === backend.ballotManager.resources.cfnResources.cfnFunction.environment) {
//   backend.ballotManager.resources.cfnResources.cfnFunction.environment = {
//     variables: {}
//   }
// }
// (backend.ballotManager.resources.cfnResources.cfnFunction.environment as CfnFunction.EnvironmentProperty).variables = {
//   'key': 'value'
// }
// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [ballotManagerApi.restApiName]: {
        endpoint: ballotManagerApi.url,
        region: Stack.of(ballotManagerApi).region,
        apiName: ballotManagerApi.restApiName,
      },
    },
    staticWeb: {
      domain: staticHosting.distributionDomainName,
    }
  },
});
