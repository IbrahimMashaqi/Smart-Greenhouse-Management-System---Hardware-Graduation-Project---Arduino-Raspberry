#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_TSL2591.h>
#include "shared.h"

const int EN_1   = 12;  const int STEP_1 = 6;  const int DIR_1 = 7;  const int LIMIT_1 = 22;
const int EN_2   = 38;  const int STEP_2 = 24; const int DIR_2 = 40; const int LIMIT_2 = 26;
const int lightPin = 53;

const int STEP_DELAY = 800;

Adafruit_TSL2591 tsl = Adafruit_TSL2591(2591);

unsigned long lastReadTime = 0;
const long    readInterval = 10000;

void moveToLimit(int stepPin, int limitPin, int stepDelayUs) {
  unsigned long start = millis();
  while (digitalRead(limitPin) == LOW) {
    digitalWrite(stepPin, HIGH); delayMicroseconds(stepDelayUs);
    digitalWrite(stepPin, LOW);  delayMicroseconds(stepDelayUs);
    if (millis() - start > 50000) {
      Serial.println("UMBRELLA TIMEOUT");
      break;
    }
  }
}

void umbrellaSetup() {
  pinMode(EN_1, OUTPUT);   pinMode(STEP_1, OUTPUT);   pinMode(DIR_1, OUTPUT);
  pinMode(EN_2, OUTPUT);   pinMode(STEP_2, OUTPUT);   pinMode(DIR_2, OUTPUT);
  pinMode(LIMIT_1, INPUT_PULLUP); pinMode(LIMIT_2, INPUT_PULLUP);
  pinMode(lightPin, OUTPUT);

  // Both motors OFF initially (HIGH disables both in test code)
  digitalWrite(EN_1, HIGH);
  digitalWrite(EN_2, HIGH);

  // Fixed directions
  digitalWrite(DIR_1, LOW);
  digitalWrite(DIR_2, LOW);

  digitalWrite(lightPin, HIGH);

  if (!tsl.begin()) { Serial.println("TSL2591 NOT FOUND"); }
  tsl.setGain(TSL2591_GAIN_LOW);
  tsl.setTiming(TSL2591_INTEGRATIONTIME_300MS);
}

void umbrellaLoop() {
  unsigned long currentTime = millis();

  if (currentTime - lastReadTime >= readInterval) {
    lastReadTime = currentTime;

    uint32_t lum  = tsl.getFullLuminosity();
    uint16_t ir   = lum >> 16;
    uint16_t full = lum & 0xFFFF;

    if (full == 0xFFFF || ir == 0xFFFF) {
      currentLux = 0;
    } else {
      float lux  = tsl.calculateLux(full, ir);
      currentLux = (!isnan(lux) && lux >= 0) ? lux : 0;
    }

    // Light Control
    if (currentLux < luxNightThreshold) {
      Serial.println("State: NIGHT → Open + Light ON");
      digitalWrite(lightPin, HIGH);
      lightState = true;
    } else if (currentLux < luxHighThreshold) {
      Serial.println("State: DAY → Open + Light OFF");
      digitalWrite(lightPin, LOW);
      lightState = false;
    } else {
      Serial.println("State: BRIGHT → Close + Light OFF");
      digitalWrite(lightPin, LOW);
      lightState = false;
    }

    // Shade Umbrella Motor Control
    if (currentLux >= luxHighThreshold) {
      // Close umbrella (Motor 2 turns, Motor 1 off)
      if (digitalRead(LIMIT_2) == LOW) {
        umbrellaState = "MOVING";
        
        digitalWrite(EN_1, LOW);
        digitalWrite(EN_2, HIGH);
        digitalWrite(DIR_2, LOW);
        
        moveToLimit(STEP_2, LIMIT_2, STEP_DELAY);
        
        digitalWrite(EN_2, HIGH); // Motor 2 OFF
        umbrellaState = "CLOSED";
        Serial.println("CLOSED");
      } else {
        umbrellaState = "CLOSED";
      }
    } else {
      // Open umbrella (Motor 1 turns, Motor 2 off)
      if (digitalRead(LIMIT_1) == LOW) {
        umbrellaState = "MOVING";
        
        digitalWrite(EN_1, HIGH);
        digitalWrite(EN_2, LOW);
        digitalWrite(DIR_1, LOW);
        
        moveToLimit(STEP_1, LIMIT_1, STEP_DELAY);
        
        digitalWrite(EN_1, HIGH); // Motor 1 OFF
        umbrellaState = "OPEN";
        Serial.println("OPEN");
      } else {
        umbrellaState = "OPEN";
      }
    }
  }
}
