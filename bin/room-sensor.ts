import { RoomSensorStack } from "../cdk/room-sensor-stack"
import * as cdk from 'aws-cdk-lib'

const app = new cdk.App()

new RoomSensorStack(app, 'room-sensor-stack', {
    stackName: 'room-sensor-stack'
})
