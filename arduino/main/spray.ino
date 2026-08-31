// SPRAY + WASH SYSTEM

#define STEP_PIN 51
#define DIR_PIN  49

#define LIMIT_START_PIN 47
#define LIMIT_END_PIN   8

#define SPRAY_RELAY_PIN 44
#define WASH_RELAY_PIN  46

#define TANK2_TRIG_PIN A4
#define TANK2_ECHO_PIN A7

#define TANK1_TRIG_PIN A1
#define TANK1_ECHO_PIN A0

const int stepDelayS = 400;

const int FORWARD_DIRS  = HIGH;
const int BACKWARD_DIRS = LOW;

const bool RELAY_ON  = HIGH;
const bool RELAY_OFF = LOW;

const float TANK2_EMPTY_THRESHOLD = 10.5;
const float TANK1_EMPTY_THRESHOLD = 10.5;

const unsigned long WASH_TIME_MS = 5000;

// --- Non-blocking background sensor polling ---
unsigned long lastSprayTankCheck = 0;
const long    SPRAY_TANK_CHECK_INTERVAL = 2000; // read every 2 seconds




// =============================================
// Renamed from readDistanceCM to avoid collision
// with irrigation.ino which defines the same name
// =============================================
float readDistanceCMSpray(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);

  if (duration == 0) {
    return 999;
  }

  return duration * 0.0343 / 2.0;
}

void sprayOn() {
  digitalWrite(SPRAY_RELAY_PIN, RELAY_ON);
  Serial.println("SPRAY ON");
}

void sprayOff() {
  digitalWrite(SPRAY_RELAY_PIN, RELAY_OFF);
  Serial.println("SPRAY OFF");
}

void washOn() {
  digitalWrite(WASH_RELAY_PIN, RELAY_ON);
  Serial.println("WASH PUMP ON");
}

void washOff() {
  digitalWrite(WASH_RELAY_PIN, RELAY_OFF);
  Serial.println("WASH PUMP OFF");
}

void allOff() {
  sprayOff();
  washOff();
}

bool tank2HasSprayLiquid() {
  float d = readDistanceCMSpray(TANK2_TRIG_PIN, TANK2_ECHO_PIN);

  Serial.print("Tank 2 Distance = ");
  Serial.print(d);
  Serial.println(" cm");

  if (d >= sprayTankEmptyThreshold) {
    Serial.println("خزان الرش فاضي");
    return false;
  }

  Serial.println("Tank 2 OK");
  return true;
}

bool tank1HasWaterForWash() {
  float d = readDistanceCMSpray(TANK1_TRIG_PIN, TANK1_ECHO_PIN);

  Serial.print("Tank 1 Distance = ");
  Serial.print(d);
  Serial.println(" cm");

  if (d >= waterTankEmptyThreshold) {
    Serial.println("عبي الخزان رقم 1");
    return false;
  }

  Serial.println("Tank 1 OK");
  return true;
}

void waitForMedicineConfirmation() {
  Serial.println();
  Serial.println("حان موعد الرش");
  Serial.println("حط الدواء والماء في خزان الرش");
  Serial.println("اكتب o للتأكيد والبدء");

  while (true) {
    if (Serial.available()) {
      char c = Serial.read();

      if (c == 'o' || c == 'O') {
        Serial.println("تم التأكيد. بدء الرش...");
        break;
      }
    }
  }
}

void washAtStart() {
  Serial.println();
  Serial.println("START WASH MODE");

  if (!isStartPressed()) {
    Serial.println("السكة ليست عند البداية، ممنوع الغسيل");
    washOff();
    return;
  }

  if (!tank1HasWaterForWash()) {
    washOff();
    return;
  }

  Serial.println("غسيل لمدة 5 ثواني");
  washOn();
  delay(WASH_TIME_MS);
  washOff();

  // ✅ بعد الغسيل يرجع يضرب ليمت البداية
  Serial.println("↩️ RETURNING TO START AFTER WASH");
  digitalWrite(DIR_PIN, BACKWARD_DIRS);

  while (!isStartPressed()) {
    stepOnce();
  }

  Serial.println("🏁 START HIT AFTER WASH");
  Serial.println("WASH DONE");
}

void runSprayCycle() {
  if (sprayRunning) return;

  sprayRunning = true;

  Serial.println();
  Serial.println("========== SPRAY MODE ==========");

  if (isEndPressed()) {
    Serial.println("END مضغوط، لا يمكن بدء الرش");
    allOff();
    sprayRunning = false;
    return;
  }

  waitForMedicineConfirmation();

  if (!tank2HasSprayLiquid()) {
    Serial.println("رغم التأكيد، قراءة خزان الرش تقول فاضي. تم إلغاء الرش.");
    sprayOff();
    sprayRunning = false;
    return;
  }

  digitalWrite(DIR_PIN, FORWARD_DIRS);
  sprayOn();

  while (!isEndPressed()) {
    stepOnce();
  }

  Serial.println("END HIT");
  sprayOff();

  delay(300);

  Serial.println("RETURNING BACK WITHOUT SPRAY");
  digitalWrite(DIR_PIN, BACKWARD_DIRS);

  while (!isStartPressed()) {
    stepOnce();
  }

  Serial.println("START HIT");
  sprayOff();

  washAtStart();

  allOff();

  Serial.println("SPRAY + WASH DONE");
  Serial.println("================================");

  sprayRunning = false;
}

void spraySetup() {
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);

  pinMode(LIMIT_START_PIN, INPUT_PULLUP);
  pinMode(LIMIT_END_PIN, INPUT_PULLUP);

  pinMode(SPRAY_RELAY_PIN, OUTPUT);
  pinMode(WASH_RELAY_PIN, OUTPUT);

  pinMode(TANK2_TRIG_PIN, OUTPUT);
  pinMode(TANK2_ECHO_PIN, INPUT);

  pinMode(TANK1_TRIG_PIN, OUTPUT);
  pinMode(TANK1_ECHO_PIN, INPUT);

  allOff();
}

void sprayLoop() {
  // --- Non-blocking background tank level monitoring ---
  // Only read sensors when NOT actively spraying to avoid
  // interfering with the spray cycle timing
  if (!sprayRunning) {
    unsigned long now = millis();
    if (now - lastSprayTankCheck >= SPRAY_TANK_CHECK_INTERVAL) {
      lastSprayTankCheck = now;

      // Read spray tank (Tank 2) distance
      sprayTankDist = readDistanceCMSpray(TANK2_TRIG_PIN, TANK2_ECHO_PIN);
      if (sprayTankDist >= 999) {
        // No echo – treat as uncertain, keep previous state
      } else {
        sprayTankOK = (sprayTankDist < sprayTankEmptyThreshold);
      }
    }
  }
}