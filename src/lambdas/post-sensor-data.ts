import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { dynamoClient } from '../lib/aws/dynamo'
import { SensorDataEvent, SensorDataType, SensorDataRecord } from '../types/sensor'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'invalid request body' })
        }
    }

    const sensorData = JSON.parse(event.body) as SensorDataEvent
    console.log('Received event data', sensorData)

    const sensorDataType = sensorData.event.split('/')[2] as SensorDataType

    const dataRecord: SensorDataRecord = {
        sensorId: sensorData.coreid,
        dataTimestamp: `${sensorDataType}/${sensorData.published_at}`,
        type: sensorDataType,
        value: sensorData.data,
        timestamp: sensorData.published_at
    }

    await dynamoClient.send(new PutCommand({
        TableName: process.env.SENSOR_TABLE_NAME!,
        Item: dataRecord
    }))

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'data processed',
            sensorDataType,
        })
    }
}
