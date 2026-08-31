// =========================================
// shared.h - المتغيرات المشتركة فقط
// =========================================
#ifndef SHARED_H
#define SHARED_H

// --- Fan (معرّفة في fan.ino / main.ino) ---
extern float  currentTemp;
extern float  currentHumidity;
extern bool   fanState;
extern float  tempThreshold;

// --- Umbrella (معرّفة في umbrella.ino / main.ino) ---
extern float  currentLux;
extern bool   lightState;
extern String umbrellaState;
extern float  luxNightThreshold;
extern float  luxHighThreshold;

// --- Irrigation (معرّفة في irrigation.ino / main.ino) ---
extern int    soil1Val;
extern int    soil2Val;
extern String soilStatus;
extern float  waterTankDist;
extern bool   waterTankOK;
extern bool   pumpRunning;
extern int    dryThreshold;
extern float  waterTankEmptyThreshold;

// --- Spray (معرّفة في spray.ino / main.ino) ---
extern float  sprayTankDist;
extern bool   sprayTankOK;
extern bool   sprayRunning;
extern float  sprayTankEmptyThreshold;

#endif
