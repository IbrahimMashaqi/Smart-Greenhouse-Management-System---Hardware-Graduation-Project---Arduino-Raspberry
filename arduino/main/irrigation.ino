// =====================================
// FINAL SMART IRRIGATION SYSTEM
// =====================================
#include "shared.h"

#define STEP_PIN        33
#define DIR_PIN         35
#define LIMIT_START_PIN 47
#define LIMIT_END_PIN   8
#define PUMP_RELAY_PIN  46
#define SOIL_1_PIN      A2
#define SOIL_2_PIN      A3
#define TRIG_PIN        A1
#define ECHO_PIN        A0

const int   stepDelay            = 400;
const int   FORWARD_DIR          = LOW;
const int   BACKWARD_DIR         = HIGH;
const bool  PUMP_ON              = HIGH;
const bool  PUMP_OFF             = LOW;
const float EMPTY_DISTANCE_CM    = 11.0;

// --- تايمر بدل delay ---
unsigned long lastIrrCheck = 0;
const long    IRR_CHECK_INTERVAL  = 3000;    // فحص كل 3 ثواني
const long    IRR_WAIT_AFTER_DONE = 60000;   // انتظر دقيقة بعد الري
bool          irrWaiting          = false;
unsigned long irrWaitStart        = 0;

// --- Background water tank sensor polling (non-blocking) ---
unsigned long lastWaterTankCheck = 0;
const long    WATER_TANK_CHECK_INTERVAL = 2000;

// =====================
bool isStartPressed() { return digitalRead(LIMIT_START_PIN) == HIGH; }
bool isEndPressed()   { return digitalRead(LIMIT_END_PIN)   == HIGH; }

void stepOnce() {
  digitalWrite(STEP_PIN, HIGH); delayMicroseconds(stepDelay);
  digitalWrite(STEP_PIN, LOW);  delayMicroseconds(stepDelay);
}

void pumpOn() {
  digitalWrite(PUMP_RELAY_PIN, PUMP_ON);
  pumpRunning = true;
  Serial.println("PUMP ON");
}

void pumpOff() {
  digitalWrite(PUMP_RELAY_PIN, PUMP_OFF);
  pumpRunning = false;
  Serial.println("PUMP OFF");
}

float readDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 999;
  return duration * 0.0343 / 2.0;
}

// =============================================
// قراءة موثوقة: عدة عينات + رفض قراءات الفشل (999) + وسيط (median).
// تُستخدم بأي قرار "فاضي/مليان" بدل القراءة الوحيدة، عشان تشويش
// لحظي (وقت تشغيل الموتور/المضخة) ما يلغي عملية ري صحيحة بالغلط.
// =============================================
float readDistanceCMFiltered(int samples = 5) {
  float valid[10];
  int validCount = 0;

  for (int i = 0; i < samples; i++) {
    float d = readDistanceCM();
    if (d < 999) {
      valid[validCount++] = d;
    }
    delay(30); // وقت استقرار بين نبضة وتانية
  }

  if (validCount == 0) {
    return 999; // فشل حقيقي بعد كل المحاولات
  }

  for (int i = 0; i < validCount - 1; i++) {
    for (int j = i + 1; j < validCount - i - 1; j++) {
      if (valid[j] > valid[j + 1]) {
        float tmp = valid[j];
        valid[j] = valid[j + 1];
        valid[j + 1] = tmp;
      }
    }
  }

  return valid[validCount / 2];
}

bool tankHasWater() {
  waterTankDist = readDistanceCMFiltered();
  waterTankOK   = (waterTankDist < waterTankEmptyThreshold);
  return waterTankOK;
}

void runIrrigation() {
  Serial.println("========== START IRRIGATION ==========");
  if (isEndPressed()) { Serial.println("END already pressed"); return; }
  if (!tankHasWater()) { pumpOff(); return; }

  // Check if water is at least 25% full
  waterTankDist = readDistanceCMFiltered();
  float water25Percent = waterTankEmptyThreshold * 0.75;
  if (waterTankDist >= water25Percent) {
    Serial.println("WARNING:WATER_LOW");
    Serial.println("Water level below 25% - Irrigation cancelled");
    pumpOff();
    return;
  }

  digitalWrite(DIR_PIN, BACKWARD_DIR);
  pumpOn();
  while (!isEndPressed()) { stepOnce(); }

  Serial.println("END HIT");
  pumpOff();
  delay(300);

  digitalWrite(DIR_PIN, FORWARD_DIR);
  while (!isStartPressed()) { stepOnce(); }

  Serial.println("START HIT - CYCLE DONE");
  pumpOff();
}

void irrigationSetup() {
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  pinMode(LIMIT_START_PIN, INPUT_PULLUP);
  pinMode(LIMIT_END_PIN,   INPUT_PULLUP);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(SOIL_1_PIN, INPUT);
  pinMode(SOIL_2_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pumpOff();
}

// Non-blocking background water tank level monitor
// Runs independently of irrigationLoop so tank level
// updates even during blocking irrigation cycles
void waterTankLoop() {
  unsigned long now = millis();
  if (now - lastWaterTankCheck >= WATER_TANK_CHECK_INTERVAL) {
    lastWaterTankCheck = now;

    float d = readDistanceCMFiltered();
    if (d >= 999) {
      // No echo - keep previous state
    } else {
      waterTankDist = d;
      waterTankOK   = (waterTankDist < waterTankEmptyThreshold);
    }
  }
}

void irrigationLoop() {
  unsigned long now = millis();

  // --- قراءة الحساسات دايمًا ---
  soil1Val   = analogRead(SOIL_1_PIN);
  soil2Val   = analogRead(SOIL_2_PIN);
  int avg    = (soil1Val + soil2Val) / 2;
  soilStatus = (avg >= dryThreshold) ? "DRY" : "WET";

  // --- لو في انتظار بعد الري ---
  if (irrWaiting) {
    if (now - irrWaitStart >= IRR_WAIT_AFTER_DONE) {
      irrWaiting = false;
    }
    return;
  }

  // --- فحص كل 3 ثواني ---
  if (now - lastIrrCheck < IRR_CHECK_INTERVAL) return;
  lastIrrCheck = now;

  if (soilStatus == "DRY" && waterTankOK) {
    runIrrigation();
    // بعد الري ابدأ الانتظار بدون delay
    irrWaiting    = true;
    irrWaitStart  = millis();
  } else {
    pumpOff();
  }
}
