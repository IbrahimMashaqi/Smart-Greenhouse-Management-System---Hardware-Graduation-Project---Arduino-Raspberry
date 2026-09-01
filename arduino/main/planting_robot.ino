#include <Servo.h>

Servo elbow;
Servo neck;

#define STEP 11
#define DIR 10
#define LIMIT 5
#define PUMB_PIN A9
#define BASE_STEP 3
#define BASE_DIR 4

#define STEPS_PER_REV 8450
#define STEP_DELAY_US 700

int elbowAngle = 90;
int neckAngle  = 70;

// =====================
// Read serial during planting so PLANT_STOP can interrupt blocking delays
// =====================
void checkPlantingSerial() {
  while (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "PLANT_STOP" && plantRunning) {
      plantingInterrupted = true;
      Serial.println("PLANT_STOPPING");
    } else if (cmd == "PLANT_STATUS") {
      Serial.print("{\"plantRunning\":");
      Serial.print(plantRunning ? "true" : "false");
      Serial.print(",\"plantsPlanted\":");
      Serial.print(plantsPlantedCount);
      Serial.print(",\"interrupted\":");
      Serial.print(plantingInterrupted ? "true" : "false");
      Serial.println("}");
    }
  }
}

// =====================
// Delay that checks serial every 50ms for interrupt
// =====================
void plantingDelay(unsigned long ms) {
  unsigned long elapsed = 0;
  while (elapsed < ms) {
    unsigned long chunk = min(50UL, ms - elapsed);
    delay(chunk);
    elapsed += chunk;
    checkPlantingSerial();
    if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  }
}

// =====================
void moveElbow(int target, int speedDelay) {
  while (elbowAngle != target) {
    if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
    if (elbowAngle < target) elbowAngle++;
    else elbowAngle--;
    elbow.write(elbowAngle);
    delay(speedDelay);
    checkPlantingSerial();
  }
}

// =====================
void moveNeck(int target, int speedDelay) {
  while (neckAngle != target) {
    if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
    if (neckAngle < target) neckAngle++;
    else neckAngle--;
    neck.write(neckAngle);
    delay(speedDelay);
    checkPlantingSerial();
  }
}

// =====================
void moveBase(bool dir, float angle) {
  long steps = (long)(angle * STEPS_PER_REV / 360.0);
  digitalWrite(BASE_DIR, dir);
  delay(10);
  for (long i = 0; i < steps; i++) {
    if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
    digitalWrite(BASE_STEP, HIGH);
    delayMicroseconds(STEP_DELAY_US);
    digitalWrite(BASE_STEP, LOW);
    delayMicroseconds(STEP_DELAY_US);
    if (i % 50 == 0) {
      elbow.write(elbowAngle);
      neck.write(neckAngle);
      checkPlantingSerial();
    }
  }
}

// =====================
void moveArm(bool d) {
  digitalWrite(DIR, d);
  for (int i = 0; i < 875; i++) {
    if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
    digitalWrite(STEP, HIGH);
    delayMicroseconds(800);
    digitalWrite(STEP, LOW);
    delayMicroseconds(800);
    if (i % 100 == 0) {
      checkPlantingSerial();
    }
  }
}

// =====================
void fillSeeds() {
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  moveNeck(32, 40);
  moveElbow(18, 40);
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  plantingDelay(300);
  digitalWrite(PUMB_PIN, HIGH);
  plantingDelay(4000);
}

// =====================
void goMiddle() {
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  moveElbow(85, 40);
  moveNeck(40, 40);
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  plantingDelay(400);
  moveBase(HIGH, 90);
  plantingDelay(100);
}

// =====================
void plantSeeds() {
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  moveNeck(73, 60);
  moveElbow(75, 60);
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  plantingDelay(10);
  digitalWrite(PUMB_PIN, LOW);
  plantingDelay(4500);
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  moveNeck(70, 60);
  plantingDelay(10);
  moveElbow(75, 60);
  plantingDelay(600);
  moveElbow(85, 40);
  moveNeck(40, 40);
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  plantingDelay(400);
  moveBase(LOW, 90);
  plantingDelay(500);
}

// =====================
void moveSteps(bool dir, int stepsCount) {
  for (int s = 0; s < stepsCount; s++) {
    if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
    moveArm(dir);
    plantingDelay(10);
  }
}

// =====================
void plant_1() {
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  fillSeeds();
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  goMiddle();
  if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
  plantSeeds();
  plantsPlantedCount++;
}

// =====================
void plant_7() {
  for (int i = 0; i < 7; i++) {
    if (plantingInterrupted) break;
    plant_1();
    if (i == 6) break;
    if (plantingInterrupted) break;
    Serial.println("PLANT_MOVE");
    moveArm(HIGH);
  }
  if (!plantingInterrupted) {
    fillSeeds();
  }
}

// =====================
void plant_6() {
  fillSeeds();
  goMiddle();
  moveSteps(LOW, 1);
  plantSeeds();
  plantsPlantedCount++;
  Serial.println("PLANT_ROW:1");

  for (int stepNum = 1; stepNum < 6; stepNum++) {
    if (plantingInterrupted) break;
    moveSteps(HIGH, stepNum);
    fillSeeds();
    goMiddle();
    moveSteps(LOW, stepNum + 1);
    plantSeeds();
    plantsPlantedCount++;
    Serial.print("PLANT_ROW:");
    Serial.println(stepNum + 1);
  }
}

// =====================
void homeArm() {
  digitalWrite(DIR, LOW);
  while (digitalRead(LIMIT) == LOW) {
    if (plantingInterrupted) {
    digitalWrite(PUMB_PIN, LOW);
    return;
  }
    digitalWrite(STEP, HIGH);
    delayMicroseconds(400);
    digitalWrite(STEP, LOW);
    delayMicroseconds(400);
  }
}

// =====================
void plantingSetup() {
  pinMode(STEP, OUTPUT);
  pinMode(DIR, OUTPUT);
  pinMode(LIMIT, INPUT_PULLUP);
  pinMode(PUMB_PIN, OUTPUT);
  pinMode(BASE_STEP, OUTPUT);
  pinMode(BASE_DIR, OUTPUT);

  digitalWrite(DIR, HIGH);

  elbow.attach(A6);
  neck.attach(A5);

  elbow.write(elbowAngle);
  neck.write(neckAngle);
}

// =====================
void plantingLoop() {
  if (plantRunning && !plantingInterrupted) {
    plant_7();
    if (!plantingInterrupted) {
      homeArm();
    }
    plantRunning = false;
    Serial.print("PLANT_DONE:");
    Serial.println(plantsPlantedCount);
    if (plantingInterrupted) {
      Serial.println("PLANT_INTERRUPTED");
    }
  }
}
