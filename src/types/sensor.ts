
export enum SensorDataType {
    TEMPERATURE = 'temperature',
    HUMIDITY = 'humidity',
    LIGHT = 'light'
}

export type SensorEvent = `sensor/data/${SensorDataType}`

export interface SensorDataEvent {
    event: SensorEvent
    data: string
    published_at: string
    coreid: string
}

export interface SensorDataRecord {
    sensorId: string
    dataTimestamp: `${SensorDataType}/${string}`
    type: SensorDataType
    value: string
    timestamp: string
}
