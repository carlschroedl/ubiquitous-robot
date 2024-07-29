import { defineFunction, secret } from "@aws-amplify/backend";


export const ballotManager = defineFunction({
  name: "ballot-manager",
  runtime: 20,
  environment: {
    PEPPER: secret('PEPPER')
  }
})