import { EventProcessorOutput } from './event-processor'

export const handler = async (event: EventProcessorOutput) => {
    console.log(event.topic)
}
