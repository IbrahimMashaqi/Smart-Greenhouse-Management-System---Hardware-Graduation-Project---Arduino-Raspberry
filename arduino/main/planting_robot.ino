#include <Servo.h>

Servo elbow;
Servo neck;

#define STEP 11
#define DIR 10
#define LIMIT 5
#define PUMB_PIN 9
#define BASE_STEP 3
#define BASE_DIR 4

#define STEPS_PER_REV 8450
#define STEP_DELAY_US 700

int elbowAngle = 90;
int neckAngle  = 70;

// =====================
// تحريك موتور elbow لحاله
void moveElbow(int target, int speedDelay) {
  while (elbowAngle != target) {
    if (elbowAngle < target) elbowAngle++;
    else elbowAngle--;

    elbow.write(elbowAngle);
    delay(speedDelay);
  }
}

// =====================
// تحريك موتور neck لحاله
void moveNeck(int target, int speedDelay) {
  while (neckAngle != target) {
    if (neckAngle < target) neckAngle++;
    else neckAngle--;

    neck.write(neckAngle);
    delay(speedDelay);
  }
}


// =====================
void moveBase(bool dir, float angle)
{
  long steps = (long)(angle * STEPS_PER_REV / 360.0);

  digitalWrite(BASE_DIR, dir);
  delay(10);

  for (long i = 0; i < steps; i++)
  {
    digitalWrite(BASE_STEP, HIGH);
    delayMicroseconds(STEP_DELAY_US);
    digitalWrite(BASE_STEP, LOW);
    delayMicroseconds(STEP_DELAY_US);

    if (i % 50 == 0) {
      elbow.write(elbowAngle);
      neck.write(neckAngle);
    }
  }
}

// =====================
void moveArm(bool d) {
  digitalWrite(DIR, d);

  for (int i = 0; i < 875; i++) {

    digitalWrite(STEP, HIGH);
    delayMicroseconds(800);
    digitalWrite(STEP, LOW);
    delayMicroseconds(800);
  }
}

// =====================
void fillSeeds() {
  moveNeck(30, 40);    // neck أولاً
  moveElbow(20, 40);
  delay(300);
  digitalWrite(PUMB_PIN, HIGH);           // ثم elbow ينزل
  delay(4000);
}

// =====================
void goMiddle() {
  moveElbow(85, 40);
  moveNeck(40, 40);
  delay(400);

  moveBase(HIGH, 90);
  delay(100);
}

// =====================
void plantSeeds() {
  moveNeck(73, 60);
  moveElbow(75, 60);
  delay(10);

  digitalWrite(PUMB_PIN, LOW);
  delay(3000);

  moveNeck(70, 60);
  delay(10);
  moveElbow(75, 60);
  delay(600);
  moveElbow(85, 40);
  moveNeck(40, 40);
  delay(400);
  moveBase(LOW, 90);
  delay(500);
}

// =====================
void moveSteps(bool dir, int stepsCount) {
  for (int s = 0; s < stepsCount; s++) {
    moveArm(dir);
    delay(10);
  }
}

// =====================
void plant_1() {
  fillSeeds();
  goMiddle();
  plantSeeds();
}

// =====================
void plant_7() {
  for (int i = 0; i < 7; i++) {
    plant_1();
    if (i == 6) return;
    Serial.println("Now must move");
    moveArm(HIGH);
  }
  fillSeeds();
}

// =====================
void plant_6() {

  fillSeeds();
  goMiddle();
  moveSteps(LOW, 1);
  plantSeeds();
  Serial.println("Row 1 done");

  for (int stepNum = 1; stepNum < 6; stepNum++) {

    moveSteps(HIGH, stepNum);
    fillSeeds();
    goMiddle();
    moveSteps(LOW, stepNum + 1);
    plantSeeds();

    Serial.print("Row done: ");
    Serial.println(stepNum + 1);
  }
}
void homeArm() {
  digitalWrite(DIR, LOW);   // direction = backward/home

  while (digitalRead(LIMIT) == LOW) {   // keep moving until switch is triggered
    digitalWrite(STEP, HIGH);
    delayMicroseconds(400);
    digitalWrite(STEP, LOW);
    delayMicroseconds(400);
  }
}
// =====================
void setup() {
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

  Serial.begin(9600);
  Serial.println("START");
}

// =====================
void loop() {
  plant_7();
  homeArm();

}
