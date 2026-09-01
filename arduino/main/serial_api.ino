// =========================================
// serial_api.ino - JSON + أوامر من الرايزبري
// =========================================

unsigned long lastSendTime = 0;
const long    SEND_INTERVAL = 1000;

void sendSensorData() {
  if (millis() - lastSendTime < SEND_INTERVAL) return;
  lastSendTime = millis();

  Serial.print("{");
  Serial.print("\"temperature\":"); Serial.print(currentTemp, 1); Serial.print(",");
  Serial.print("\"humidity\":"); Serial.print(currentHumidity, 1); Serial.print(",");
  Serial.print("\"fan\":"); Serial.print(fanState ? "true" : "false"); Serial.print(",");
  Serial.print("\"lux\":"); Serial.print(isnan(currentLux) ? 0.0 : currentLux, 1); Serial.print(",");
  Serial.print("\"umbrella\":\""); Serial.print(umbrellaState); Serial.print("\",");
  Serial.print("\"light\":"); Serial.print(lightState ? "true" : "false"); Serial.print(",");
  Serial.print("\"soil1\":"); Serial.print(soil1Val); Serial.print(",");
  Serial.print("\"soil2\":"); Serial.print(soil2Val); Serial.print(",");
  Serial.print("\"soilStatus\":\""); Serial.print(soilStatus); Serial.print("\",");
  Serial.print("\"pump\":"); Serial.print(pumpRunning ? "true" : "false"); Serial.print(",");
  Serial.print("\"waterTankDist\":"); Serial.print(waterTankDist, 1); Serial.print(",");
  Serial.print("\"waterTankOK\":"); Serial.print(waterTankOK ? "true" : "false"); Serial.print(",");
  Serial.print("\"sprayTankDist\":"); Serial.print(sprayTankDist, 1); Serial.print(",");
  Serial.print("\"sprayTankOK\":"); Serial.print(sprayTankOK ? "true" : "false"); Serial.print(",");
  Serial.print("\"sprayRunning\":"); Serial.print(sprayRunning ? "true" : "false"); Serial.print(",");
  Serial.print("\"plantRunning\":"); Serial.print(plantRunning ? "true" : "false"); Serial.print(",");
  Serial.print("\"plantsPlanted\":"); Serial.print(plantsPlantedCount); Serial.print(",");
  Serial.print("\"tempThreshold\":"); Serial.print(tempThreshold, 1); Serial.print(",");
  Serial.print("\"luxNightThreshold\":"); Serial.print(luxNightThreshold, 1); Serial.print(",");
  Serial.print("\"luxHighThreshold\":"); Serial.print(luxHighThreshold, 1); Serial.print(",");
  Serial.print("\"dryThreshold\":"); Serial.print(dryThreshold); Serial.print(",");
  Serial.print("\"waterTankEmptyThreshold\":"); Serial.print(waterTankEmptyThreshold, 1); Serial.print(",");
  Serial.print("\"sprayTankEmptyThreshold\":"); Serial.print(sprayTankEmptyThreshold, 1);
  Serial.println("}");
}

void handleSerialCommands() {
  if (!Serial.available()) return;
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();

  if (cmd.startsWith("SET_TEMP:")) {
    tempThreshold = cmd.substring(9).toFloat();
    Serial.println("ACK:TEMP_THRESHOLD_UPDATED");
  } else if (cmd.startsWith("SET_LUX_NIGHT:")) {
    luxNightThreshold = cmd.substring(14).toFloat();
    Serial.println("ACK:LUX_NIGHT_UPDATED");
  } else if (cmd.startsWith("SET_LUX_HIGH:")) {
    luxHighThreshold = cmd.substring(13).toFloat();
    Serial.println("ACK:LUX_HIGH_UPDATED");
  } else if (cmd.startsWith("SET_SOIL:")) {
    dryThreshold = cmd.substring(9).toInt();
    Serial.println("ACK:SOIL_THRESHOLD_UPDATED");
  } else if (cmd.startsWith("SET_WATER_TANK:")) {
    waterTankEmptyThreshold = cmd.substring(15).toFloat();
    Serial.println("ACK:WATER_TANK_THRESHOLD_UPDATED");
  } else if (cmd.startsWith("SET_SPRAY_TANK:")) {
    sprayTankEmptyThreshold = cmd.substring(15).toFloat();
    Serial.println("ACK:SPRAY_TANK_THRESHOLD_UPDATED");
  } else if (cmd == "IRRIGATE_START" || cmd == "WATER_START") {
    runIrrigation();
  } else if (cmd == "SPRAY_START" || cmd == "s" || cmd == "S") {
    runSprayCycle();
  } else if (cmd == "PLANT_START") {
    if (!plantRunning) {
      plantRunning = true;
      plantingInterrupted = false;
      plantsPlantedCount = 0;
      Serial.println("PLANT_STARTED");
    }
  } else if (cmd == "PLANT_STOP" && plantRunning) {
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
