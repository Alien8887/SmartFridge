#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <HX711.h>
#include <ESP32Servo.h>
#include <Preferences.h>
#include <string.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define HX_DT 16
#define HX_SCK 17
#define DOOR_PIN 5
#define SERVO_PIN 18
#define BUZZER_PIN 22

DHT dht(DHTPIN, DHTTYPE);
HX711 scale;
Servo coolingServo;
Preferences preferences;

const char* ssid      = "Wokwi-GUEST";
const char* password  = "";
const char* serverUrl = "https://smart-fridge-two.vercel.app/api/sensors";

#define DEVICE_TOKEN_OVERRIDE ""

char deviceToken[80] = "";
const char* PREFS_NAMESPACE = "smartfridge";
const char* PREFS_KEY       = "devtoken";

float CALIBRATION_FACTOR = 420.0;
const unsigned long DOOR_ALARM_S = 30;
const float STARTUP_GOAL = 4.0;

bool  dhtOK = false, hxOK = false;
float actualTemp = 0, actualHum = 0, weight = 0;
float goalTemp = STARTUP_GOAL;
int   servoAngle = 90;
bool  doorOpen = false, doorWasOpen = false;
unsigned long doorOpenAt = 0;

uint8_t dhtFailStreak = 0, hxFailStreak = 0;
const uint8_t MAX_FAIL_STREAK = 5;
unsigned long lastHxRetryAt = 0;
const unsigned long HX_RETRY_MS = 30000;

wl_status_t lastWifiStatus = WL_IDLE_STATUS;
unsigned long wifiRetryAt = 0;
unsigned long wifiBackoffMs = 2000;
const unsigned long WIFI_BACKOFF_MAX_MS = 30000;
uint16_t httpFailStreak = 0;

unsigned long lastSend = 0, lastGoalCheck = 0;
const unsigned long SEND_MS = 2000, GOAL_MS = 5000;

void pairDevice() {
  Serial.println(F("\n================================================"));
  Serial.println(F("  DEVICE PAIRING REQUIRED"));
  Serial.println(F("================================================"));
  Serial.println(F("No device token found in flash memory."));
  Serial.println(F("1. Open the Smart Fridge dashboard and sign in"));
  Serial.println(F("2. Go to Profile -> Connect Your Fridge"));
  Serial.println(F("3. Click 'Get connection code'"));
  Serial.println(F("4. Paste the code below and press Enter"));
  Serial.println(F("------------------------------------------------"));
  Serial.print(F("Token: "));

  while (true) {
    if (Serial.available()) {
      String input = Serial.readStringUntil('\n');
      input.trim();

      if (input.length() >= 32 && input.length() < sizeof(deviceToken)) {
        input.toCharArray(deviceToken, sizeof(deviceToken));
        preferences.putString(PREFS_KEY, input);
        Serial.println();
        Serial.println(F("[Auth] Token saved to flash. Continuing boot...\n"));
        return;
      } else if (input.length() > 0) {
        Serial.println();
        Serial.print(F("[Auth] That doesn't look like a valid token ("));
        Serial.print(input.length());
        Serial.println(F(" chars, expected ~48). Try again:"));
        Serial.print(F("Token: "));
      }
    }
    delay(50);
  }
}

void loadOrPairDeviceToken() {
  preferences.begin(PREFS_NAMESPACE, false);

  if (strlen(DEVICE_TOKEN_OVERRIDE) > 0) {
    strncpy(deviceToken, DEVICE_TOKEN_OVERRIDE, sizeof(deviceToken) - 1);
    Serial.println(F("[Auth] Using DEVICE_TOKEN_OVERRIDE from source code."));
    return;
  }

  String saved = preferences.getString(PREFS_KEY, "");
  if (saved.length() > 0) {
    saved.toCharArray(deviceToken, sizeof(deviceToken));
    Serial.println(F("[Auth] Loaded device token from flash memory."));
    return;
  }

  pairDevice();
}

void checkSerialCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("RESET_TOKEN")) {
      preferences.remove(PREFS_KEY);
      Serial.println(F("[Auth] Token cleared from flash. Restarting..."));
      delay(500);
      ESP.restart();
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n=== Smart Fridge booting (v15) ==="));

  loadOrPairDeviceToken();

  pinMode(DOOR_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  coolingServo.attach(SERVO_PIN);
  coolingServo.write(90);

  initDHT();
  initHX711();
  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  checkSerialCommands();
  maintainWiFi(now);

  if (now - lastSend >= SEND_MS) {
    lastSend = now;
    readSensors(now);
    doorOpen = digitalRead(DOOR_PIN) == LOW;
    updateServo();
    handleDoorAlarm();
    sendData();
    printStatus();
  }

  if (now - lastGoalCheck >= GOAL_MS) {
    lastGoalCheck = now;
    fetchGoalTemp();
  }
}

void initDHT() {
  dht.begin();
  delay(2000);
  float t = dht.readTemperature();
  dhtOK = !isnan(t);
  Serial.println(dhtOK ? F("[DHT22] OK") : F("[DHT22] FAILED on first read — check VCC/GND/DATA wiring"));
}

void initHX711() {
  scale.begin(HX_DT, HX_SCK);
  hxOK = scale.wait_ready_timeout(3000);
  if (hxOK) {
    scale.set_scale(CALIBRATION_FACTOR);
    scale.tare(20);
    Serial.println(F("[HX711] OK, tared to zero"));
  } else {
    Serial.println(F("[HX711] FAILED to respond — will retry periodically"));
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print(F("[WiFi] Connecting"));
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) { delay(300); Serial.print('.'); }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("[WiFi] Connected — IP ")); Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("[WiFi] Initial connect timed out — retrying in background"));
  }
  lastWifiStatus = WiFi.status();
}

void maintainWiFi(unsigned long now) {
  wl_status_t status = WiFi.status();
  if (status != lastWifiStatus) {
    if (status == WL_CONNECTED) { Serial.println(F("[WiFi] Reconnected")); wifiBackoffMs = 2000; }
    else Serial.println(F("[WiFi] Connection lost"));
    lastWifiStatus = status;
  }
  if (status != WL_CONNECTED && now >= wifiRetryAt) {
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    wifiRetryAt = now + wifiBackoffMs;
    wifiBackoffMs = min(wifiBackoffMs * 2, WIFI_BACKOFF_MAX_MS);
  }
}

void readSensors(unsigned long now) {
  float t = dht.readTemperature(), h = dht.readHumidity();
  if (isnan(t) || isnan(h)) { delay(300); t = dht.readTemperature(); h = dht.readHumidity(); }
  if (isnan(t) || isnan(h)) {
    dhtFailStreak++;
    if (dhtFailStreak >= MAX_FAIL_STREAK && dhtOK) { dhtOK = false; Serial.println(F("[DHT22] Marked OFFLINE")); }
  } else {
    if (!dhtOK) Serial.println(F("[DHT22] Back online"));
    dhtOK = true; dhtFailStreak = 0; actualTemp = t; actualHum = h;
  }

  if (hxOK) {
    if (scale.wait_ready_timeout(800)) {
      float w = scale.get_units(5);
      if (isnan(w)) w = weight;
      if (fabs(w) < 0.05) w = 0;
      if (w < 0) w = 0;
      weight = w; hxFailStreak = 0;
    } else {
      hxFailStreak++;
      if (hxFailStreak >= MAX_FAIL_STREAK) { hxOK = false; Serial.println(F("[HX711] Marked OFFLINE")); }
    }
  } else if (now - lastHxRetryAt >= HX_RETRY_MS) {
    lastHxRetryAt = now;
    Serial.println(F("[HX711] Retrying init..."));
    initHX711();
  }
}

void updateServo() {
  if (!dhtOK) return;
  int target = constrain(90 + (int)((actualTemp - goalTemp) * 15.0), 0, 180);
  if (abs(target - servoAngle) > 2) { coolingServo.write(target); servoAngle = target; }
}

void handleDoorAlarm() {
  if (doorOpen) {
    if (!doorWasOpen) { doorOpenAt = millis(); doorWasOpen = true; }
    if ((millis() - doorOpenAt) / 1000 >= DOOR_ALARM_S) tone(BUZZER_PIN, 2000, 200);
  } else if (doorWasOpen) {
    doorWasOpen = false;
    noTone(BUZZER_PIN);
  }
}

void fetchGoalTemp() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (strlen(deviceToken) == 0) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Authorization", String("Bearer ") + deviceToken);
  http.setTimeout(5000);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    int i = body.indexOf("\"goalTemp\":");
    if (i != -1) {
      i += 11;
      int end = body.indexOf(",", i); if (end == -1) end = body.indexOf("}", i);
      float v = body.substring(i, end).toFloat();
      if (v >= 0 && v <= 15) {
        if (fabs(v - goalTemp) > 0.05) { Serial.print(F("[Goal] Updated to ")); Serial.print(v, 1); Serial.println(F("C")); }
        goalTemp = v;
      }
    }
  } else if (code == 401) {
    Serial.println(F("[Goal] 401 Unauthorized — token was rejected. Type RESET_TOKEN over Serial to re-pair."));
  } else if (code < 0) {
    Serial.print(F("[Goal] Request failed: ")); Serial.println(http.errorToString(code));
  }
  http.end();
}

void sendData() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (strlen(deviceToken) == 0) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + deviceToken);
  http.setTimeout(8000);

  String json = "{";
  json += "\"temperature\":" + String(dhtOK ? actualTemp : -999, 2) + ",";
  json += "\"humidity\":"    + String(dhtOK ? actualHum  : -999, 2) + ",";
  json += "\"weight\":"      + String(hxOK  ? weight     : -999, 2) + ",";
  json += "\"doorOpen\":"    + String(doorOpen ? "true" : "false") + ",";
  json += "\"servoAngle\":"  + String(servoAngle) + ",";
  json += "\"dhtOK\":"       + String(dhtOK ? "true" : "false") + ",";
  json += "\"hxOK\":"        + String(hxOK ? "true" : "false") + ",";
  json += "\"rssi\":"        + String(WiFi.RSSI()) + ",";
  json += "\"uptimeSec\":"   + String(millis() / 1000);
  json += "}";

  int code = http.POST(json);
  if (code == 200) {
    if (httpFailStreak > 0) Serial.println(F("[Send] Recovered after previous failures"));
    httpFailStreak = 0;
  } else {
    httpFailStreak++;
    Serial.print(F("[Send] Failed, HTTP ")); Serial.print(code);
    if (code == 401) Serial.println(F(" — token rejected. Type RESET_TOKEN over Serial to re-pair."));
    else Serial.println();
    if (httpFailStreak == 10) {
      Serial.println(F("[Send] 10 consecutive failures — forcing a WiFi reconnect"));
      WiFi.disconnect();
    }
  }
  http.end();
}

void printStatus() {
  Serial.print(F("Actual "));  Serial.print(dhtOK ? String(actualTemp, 1) : "ERR"); Serial.print(F("C"));
  Serial.print(F(" | Goal ")); Serial.print(goalTemp, 1); Serial.print(F("C"));
  Serial.print(F(" | Hum "));  Serial.print(dhtOK ? String(actualHum, 1) : "ERR"); Serial.print(F("%"));
  Serial.print(F(" | Wt "));   Serial.print(hxOK ? String(weight, 2) : "ERR"); Serial.print(F("kg"));
  Serial.print(F(" | Door ")); Serial.print(doorOpen ? F("OPEN") : F("closed"));
  Serial.print(F(" | Servo ")); Serial.print(servoAngle); Serial.print(F("deg"));
  Serial.print(F(" | WiFi "));  Serial.println(WiFi.status() == WL_CONNECTED ? F("up") : F("DOWN"));
}