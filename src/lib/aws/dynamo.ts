import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
)

export { dynamoClient }