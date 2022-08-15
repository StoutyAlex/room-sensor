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

    Particle.publish("temperature", temperatureString, WITH_ACK);
    Particle.publish("humidity", humidityString, WITH_ACK);
    Particle.publish("light", lightString, WITH_ACK);

    delay(15000);
    System.sleep(SLEEP_MODE_DEEP, 30);
}
