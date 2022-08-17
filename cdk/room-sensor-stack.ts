import * as cdk from 'aws-cdk-lib'
import * as dynamo from 'aws-cdk-lib/aws-dynamodb'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import path from 'path'

export class RoomSensorStack extends cdk.Stack {
    constructor(app: cdk.App, id: string, props: cdk.StackProps) {
        super(app, id, props)

        const sensorDataTable = new dynamo.Table(this, 'sensor-database', {
            tableName: 'sensor-data',
            partitionKey: {
                type: dynamo.AttributeType.STRING,
                name: 'sensorId'
            },
            sortKey: {
                type: dynamo.AttributeType.STRING,
                name: 'dataTimestamp'
            }
        })

        sensorDataTable.addGlobalSecondaryIndex({
            indexName: 'timestampIndex',
            partitionKey: {
                type: dynamo.AttributeType.STRING,
                name: 'timestamp'
            }
        })

        const postSensorDataLambda = new NodejsFunction(this, 'post-data', {
            entry: path.join(__dirname, '../src/lambdas/post-sensor-data.ts'),
            functionName: 'post-sensor-data',
            bundling: {
                forceDockerBundling: false
            },
            environment: {
                SENSOR_TABLE_NAME: sensorDataTable.tableName
            }
        })

        // TODO: Authentication
        const api = new RestApi(this, 'api', {
            restApiName: 'room-sensor',
        })

        api.root.addMethod('POST', new LambdaIntegration(postSensorDataLambda))

        sensorDataTable.grantWriteData(postSensorDataLambda)

        new cdk.CfnOutput(this, 'api-url', {
            value: api.url,
        })
    }
}
