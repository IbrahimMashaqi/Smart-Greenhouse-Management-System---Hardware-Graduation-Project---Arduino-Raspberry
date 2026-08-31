// =========================================
// main.ino
// =========================================

#include <DHT.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_TSL2591.h>
#include "shared.h"

// =========================================
// تعريف كل المتغيرات المشتركة هون مرة واحدة
// =========================================

// Fan
float  currentTemp     = 0;
float  currentHumidity = 0;
bool   fanState        = false;
float  tempThreshold   = 28.0;

// Umbrella
float  currentLux        = 0;
bool   lightState        = false;
String umbrellaState     = "OPEN";
float  luxNightThreshold = 20.0;
float  luxHighThreshold  = 100.0;

// Irrigation
int    soil1Val                = 0;
int    soil2Val                = 0;
String soilStatus              = "WET";
float  waterTankDist           = 0;
bool   waterTankOK             = true;
bool   pumpRunning             = false;
int    dryThreshold            = 400;
float  waterTankEmptyThreshold = 11.0;

// Spray
float  sprayTankDist           = 0;
bool   sprayTankOK             = true;
bool   sprayRunning            = false;
float  sprayTankEmptyThreshold = 10.5;

// =========================================

void setup() {
  Serial.begin(9600);
  fanSetup();
  umbrellaSetup();
  irrigationSetup();
  spraySetup();
  Serial.println("SYSTEM READY");
}

void loop() {
  fanLoop();
  umbrellaLoop();
  waterTankLoop();
  irrigationLoop();
  sprayLoop();
  handleSerialCommands();
  sendSensorData();
}
