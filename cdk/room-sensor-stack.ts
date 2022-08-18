import * as cdk from 'aws-cdk-lib'
import * as dynamo from 'aws-cdk-lib/aws-dynamodb'
import * as eventTargets from 'aws-cdk-lib/aws-events-targets'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks'
import { Choice, Condition, Parallel, StateMachine, Succeed } from 'aws-cdk-lib/aws-stepfunctions'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import path from 'path'
import { Rule } from 'aws-cdk-lib/aws-events'

export class RoomSensorStack extends cdk.Stack {
    constructor(app: cdk.App, id: string, props: cdk.StackProps) {
        super(app, id, props)

        const bundling = {
            forceDockerBundling: false
        }

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
            environment: {
                SENSOR_TABLE_NAME: sensorDataTable.tableName
            },
            bundling,
        })

        const processingDeadLetterQueue = new Queue(this, 'processing-dlq', {
            queueName: 'event-processing-dlq',
            retentionPeriod: cdk.Duration.days(7)
        })

        // TODO: Authentication
        const api = new RestApi(this, 'api', {
            restApiName: 'room-sensor',
        })

        api.root.addMethod('POST', new LambdaIntegration(postSensorDataLambda))

        sensorDataTable.grantWriteData(postSensorDataLambda)

        const eventProcessor = new NodejsFunction(this, 'event-processor', {
            entry: path.join(__dirname, '../src/lambdas/step-functions/event-processor.ts'),
            functionName: 'event-processor',
            bundling
        })

        const notificationProcessor = new NodejsFunction(this, 'notification-processor', {
            entry: path.join(__dirname, '../src/lambdas/step-functions/notification-processor.ts'),
            functionName: 'notification-processor',
            bundling
        })

        const webhookProcessor = new NodejsFunction(this, 'webhook-processor', {
            entry: path.join(__dirname, '../src/lambdas/step-functions/webhook-processor.ts'),
            functionName: 'topic-processor',
            bundling
        })

        const eventInvocation = new LambdaInvoke(this, 'event-processor-invoke', {
            lambdaFunction: eventProcessor,
            outputPath: '$.Payload'
        })

        const notificationInvocation = new LambdaInvoke(this, 'notification-processor-invoke', {
            lambdaFunction: notificationProcessor
        })

        const webhookInvocation = new LambdaInvoke(this, 'webhook-processor-invoke', {
            lambdaFunction: webhookProcessor
        })

        const notNotification = new Succeed(this, 'not-notification')
        const notWebhook = new Succeed(this, 'not-webhook')

        const notificationChoice = new Choice(this, 'notification-choice', {})
        const webhookChoice = new Choice(this, 'webhook-choice', {})

        const isNotificationEvent = Condition.booleanEquals('$.eventTypes.notification', true)
        const isWebhookEvent = Condition.booleanEquals('$.eventTypes.webhook', true)

        const parrarelStep = new Parallel(this, 'event-handlers-parallel')
            .branch(notificationChoice.when(isNotificationEvent, notificationInvocation).otherwise(notNotification))
            .branch(webhookChoice.when(isWebhookEvent, webhookInvocation).otherwise(notWebhook))

        const stepFunctionDefinition = eventInvocation.next(parrarelStep)

        const eventProcessState = new StateMachine(this, 'notification-state', {
            stateMachineName: 'notification-process-state',
            timeout: cdk.Duration.minutes(5),
            definition: stepFunctionDefinition
        })

        new Rule(this, 'trigger-step-function', {
            eventPattern: {
                source: ['PartnerMarketplace'],
                detailType: ['VehicleIngested'],
            },
            targets: [new eventTargets.SfnStateMachine(eventProcessState)]
        })

        new Rule(this, 'ProcessingFailedRule', {
            eventPattern: {
              source: ['aws.states'],
              detailType: ['Step Functions Execution Status Change'],
              detail: {
                stateMachineArn: [eventProcessState.stateMachineArn],
                status: ['FAILED', 'TIMED_OUT', 'ABORTED'],
              },
            },
            targets: [new eventTargets.SqsQueue(processingDeadLetterQueue)],
          })

        new cdk.CfnOutput(this, 'api-url', {
            value: api.url,
        })
    }
}
