#include <DHT.h>
#include "shared.h"

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

// float currentTemp     = 0;
// float currentHumidity = 0;
// bool  fanState        = false;

unsigned long lastFanRead = 0;
const long fanReadInterval = 3000;

void fanSetup() {
  dht.begin();
  pinMode(9, OUTPUT);
}

void fanLoop() {
  if (millis() - lastFanRead < fanReadInterval) return;
  lastFanRead = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) return;

  currentTemp     = t;
  currentHumidity = h;

  if (t > tempThreshold) {
    digitalWrite(9, HIGH);
    fanState = true;
  } else {
    digitalWrite(9, LOW);
    fanState = false;
  }
}
