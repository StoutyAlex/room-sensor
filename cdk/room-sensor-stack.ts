import * as cdk from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import path from 'path'

export class RoomSensorStack extends cdk.Stack {
    constructor(app: cdk.App, id: string, props: cdk.StackProps) {
        super(app, id, props)

        const postSensorDataLambda = new NodejsFunction(this, 'post-data', {
            entry: path.join(__dirname, '../src/lambdas/post-sensor-data.ts'),
            functionName: 'post-sensor-data'
        })

        const api = new RestApi(this, 'api', {
            restApiName: 'room-sensor',
        })

        api.root.addMethod('POST', new LambdaIntegration(postSensorDataLambda))

        new cdk.CfnOutput(this, 'api-url', {
            value: api.url,
        })
    }
}
