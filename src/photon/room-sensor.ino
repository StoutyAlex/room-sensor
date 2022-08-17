#include "lib/sensors/Si70xx.h"
#include "lib/sensors/Si1132.h"

Si70xx tempAndHum;
Si1132 light;

void setup() {
    tempAndHum.begin();
    light.begin();
}

void loop() {
    if (Particle.connected() == false) {
        Particle.connect();
    }

    double temperature = tempAndHum.readTemperature();
    double humidity = tempAndHum.readHumidity();
    double lightLevel = light.readVisible();

    String temperatureString = String(temperature);
    String humidityString = String(humidity);
    String lightString = String(lightLevel);

    bool tempPublished = Particle.publish("sensor/data/temperature", temperatureString, WITH_ACK);
    bool humidityPublished = Particle.publish("sensor/data/humidity", humidityString, WITH_ACK);
    bool lightPublished = Particle.publish("sensor/data/light", lightString, WITH_ACK);

    Serial.println("Temperature event published: " + String(tempPublished));
    Serial.println("Humidity event published: " + String(humidityPublished));
    Serial.println("Light event published: " + String(lightPublished));

    delay(15000);
    System.sleep(SLEEP_MODE_DEEP, 1200);
}
