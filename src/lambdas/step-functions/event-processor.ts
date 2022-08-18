enum Topic {
    VEHICLE_INGESTED = 'vehicleIngested'
}

interface EventProcessorInput {
    detail: {
        notificationEvent: boolean
        webhookEvent: boolean
    }
}

export interface EventProcessorOutput {
    topic: Topic
    eventTypes: {
        webhook: boolean
        notification: boolean
    },
}

export const handler = async (event: EventProcessorInput): Promise<EventProcessorOutput> => {
    const { notificationEvent, webhookEvent } = event.detail

    return {
        topic: Topic.VEHICLE_INGESTED,
        eventTypes: {
            notification: notificationEvent,
            webhook: webhookEvent
        }
    }
}
