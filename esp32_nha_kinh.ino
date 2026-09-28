/*
  ===================================================================
  NHA KINH THONG MINH - ESP32 FIRMWARE
  Smart Greenhouse Monitoring and Control System
  ===================================================================
  
  CHUC NANG:
  - Doc 6 cam bien: nhiet do/do am (DHT22), do am dat, anh sang (BH1750),
    muc nuoc, khoi/gas (MQ-2)
  - Dieu khien 4 thiet bi qua Relay 4 kenh: may bom, quat, den LED, coi
  - Hien thi LCD 1602 I2C
  - Web Server phuc vu giao dien HTML va API REST
  - Tu dong dieu khien theo nguong cai dat
  - Che do Thu Cong tu xa qua Web
  
  SO DO KET NOI (WIRING):
  ===================================================================
  
  +--------------------------------------------------------------+
  |                     ESP32 DEVKIT V1                           |
  |                                                              |
  |  3.3V ----+---- VCC DHT22                                    |
  |           +---- VCC BH1750                                   |
  |           +---- VCC Water Level Sensor                       |
  |                                                              |
  |  5V   ----+---- VCC LCD 1602 I2C                             |
  |           +---- VCC MQ-2                                     |
  |           +---- VCC Relay Module (VCC)                        |
  |                                                              |
  |  GND  ----+---- GND (tat ca cam bien + relay + LCD)          |
  |                                                              |
  |  GPIO 4  ---- DATA DHT22 (noi dien tro 10K len 3.3V)        |
  |  GPIO 21 ---- SDA  (I2C) -> SDA LCD + SDA BH1750            |
  |  GPIO 22 ---- SCL  (I2C) -> SCL LCD + SCL BH1750            |
  |  GPIO 34 ---- AO   Soil Moisture Sensor (Analog In)         |
  |  GPIO 35 ---- AO   Water Level Sensor   (Analog In)         |
  |  GPIO 32 ---- AO   MQ-2 Gas Sensor      (Analog In)         |
  |  GPIO 26 ---- IN1  Relay (May Bom)                           |
  |  GPIO 27 ---- IN2  Relay (Quat)                              |
  |  GPIO 14 ---- IN3  Relay (Den LED)                           |
  |  GPIO 12 ---- IN4  Relay (Coi Buzzer)                        |
  +--------------------------------------------------------------+
  
  CHI TIET KET NOI TUNG CAM BIEN:
  
  1. DHT22 (Nhiet do & Do am KK):
     - VCC  -> 3.3V
     - GND  -> GND
     - DATA -> GPIO 4 (kem dien tro keo len 10K ohm tu DATA len 3.3V)
  
  2. BH1750 (Cam bien anh sang - I2C):
     - VCC  -> 3.3V
     - GND  -> GND
     - SDA  -> GPIO 21
     - SCL  -> GPIO 22
     - ADDR -> GND (dia chi 0x23)
  
  3. LCD 1602 I2C:
     - VCC  -> 5V
     - GND  -> GND
     - SDA  -> GPIO 21 (chung bus I2C voi BH1750)
     - SCL  -> GPIO 22
     * Dia chi I2C mac dinh: 0x27 (hoac 0x3F)
  
  4. Cam bien do am dat dien dung (Capacitive Soil Moisture v1.2):
     - VCC  -> 3.3V
     - GND  -> GND
     - AOUT -> GPIO 34 (chi doc analog, khong co pull-up noi)
  
  5. Cam bien muc nuoc (Water Level Sensor):
     - VCC  -> 3.3V (hoac dung GPIO de bat/tat de tiet kiem dien)
     - GND  -> GND
     - SIG  -> GPIO 35 (analog input)
  
  6. MQ-2 (Cam bien khoi/gas):
     - VCC  -> 5V
     - GND  -> GND
     - AO   -> GPIO 32 (analog output)
     * Luu y: MQ-2 can thoi gian khoi dong (preheat) ~20 giay
  
  7. Module Relay 4 kenh (Active LOW):
     - VCC  -> 5V
     - GND  -> GND (chung voi ESP32)
     - IN1  -> GPIO 26 (May bom)
     - IN2  -> GPIO 27 (Quat)
     - IN3  -> GPIO 14 (Den LED)
     - IN4  -> GPIO 12 (Coi Buzzer)
     * JD-VCC co the cap nguon rieng 5V de cach ly
  
  8. Cac thiet bi chap hanh (noi qua Relay):
     - Relay CH1 -> May bom mini 5V (COM-NO)
     - Relay CH2 -> Quat tan nhiet 5V (COM-NO)
     - Relay CH3 -> Day LED trong cay 5V (COM-NO)
     - Relay CH4 -> Coi buzzer 5V (COM-NO)
     * Nguon 5V rieng cho thiet bi chap hanh (adaptor USB 5V/2A)
  
  ===================================================================
  THU VIEN CAN CAI DAT (Arduino IDE):
  - DHT sensor library (Adafruit)
  - Adafruit Unified Sensor
  - BH1750 (by Christopher Laws)
  - LiquidCrystal_I2C (by Frank de Brabander)
  - ArduinoJson (by Benoit Blanchon)
  - ESPAsyncWebServer
  - AsyncTCP
  ===================================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ==================== CAU HINH WIFI ====================
const char* ssid = "TEN_WIFI_CUA_BAN";       // <-- DOI TEN WIFI
const char* password = "MAT_KHAU_WIFI";       // <-- DOI MAT KHAU

// ==================== DINH NGHIA CHAN ====================
// Cam bien
#define DHT_PIN         4       // DHT22 data pin
#define DHT_TYPE        DHT22
#define SOIL_PIN        34      // Cam bien do am dat (Analog)
#define WATER_PIN       35      // Cam bien muc nuoc (Analog)
#define GAS_PIN         32      // MQ-2 gas sensor (Analog)

// Relay (Active LOW)
#define RELAY_PUMP      26      // May bom - Relay IN1
#define RELAY_FAN       27      // Quat    - Relay IN2
#define RELAY_LED       14      // Den LED - Relay IN3
#define RELAY_BUZZER    12      // Coi     - Relay IN4

// ==================== KHOI TAO DOI TUONG ====================
DHT dht(DHT_PIN, DHT_TYPE);
BH1750 lightMeter;
LiquidCrystal_I2C lcd(0x27, 16, 2);  // Dia chi 0x27, 16 cot x 2 hang
WebServer server(80);

// ==================== BIEN LUU TRU ====================
// Du lieu cam bien
float temperature = 0;
float humidity = 0;
float soilMoisture = 0;
float lightLevel = 0;
float waterLevel = 0;
float gasLevel = 0;

// Trang thai thiet bi
bool pumpState = false;
bool fanState = false;
bool ledState = false;
bool buzzerState = false;

// Che do dieu khien: true = Auto, false = Manual
bool pumpAuto = true;
bool fanAuto = true;
bool ledAuto = true;
bool buzzerAuto = true;

// Nguong tu dong
float threshTempHigh = 35.0;
float threshTempLow = 28.0;
float threshSoilLow = 30.0;
float threshSoilHigh = 70.0;
float threshLightLow = 300.0;
float threshLightHigh = 1000.0;
float threshGasHigh = 400.0;
float threshWaterLow = 15.0;

// Timing
unsigned long lastSensorRead = 0;
unsigned long lastLCDUpdate = 0;
const unsigned long SENSOR_INTERVAL = 2000;   // Doc cam bien moi 2 giay
const unsigned long LCD_INTERVAL = 3000;      // Cap nhat LCD moi 3 giay
int lcdPage = 0;                              // Trang hien thi LCD

// Calibration cho cam bien analog
// Do am dat: gia tri ADC kho ~ 4095, uot ~ 1500 (dien dung)
#define SOIL_DRY    4095
#define SOIL_WET    1500

// Muc nuoc: gia tri ADC khong nuoc ~ 0, day ~ 2500
#define WATER_MIN   0
#define WATER_MAX   2500

// ==================== HAM SETUP ====================
void setup() {
    Serial.begin(115200);
    Serial.println("\n====================================");
    Serial.println("  NHA KINH THONG MINH - Starting...");
    Serial.println("====================================");

    // Khoi tao I2C
    Wire.begin(21, 22);

    // Khoi tao DHT22
    dht.begin();
    Serial.println("[OK] DHT22 initialized");

    // Khoi tao BH1750
    if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
        Serial.println("[OK] BH1750 initialized");
    } else {
        Serial.println("[FAIL] BH1750 not found!");
    }

    // Khoi tao LCD
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Nha Kinh TM");
    lcd.setCursor(0, 1);
    lcd.print("Dang khoi dong..");
    Serial.println("[OK] LCD 1602 initialized");

    // Cau hinh chan Relay (OUTPUT, mac dinh TAT = HIGH vi Active LOW)
    pinMode(RELAY_PUMP, OUTPUT);
    pinMode(RELAY_FAN, OUTPUT);
    pinMode(RELAY_LED, OUTPUT);
    pinMode(RELAY_BUZZER, OUTPUT);
    digitalWrite(RELAY_PUMP, HIGH);
    digitalWrite(RELAY_FAN, HIGH);
    digitalWrite(RELAY_LED, HIGH);
    digitalWrite(RELAY_BUZZER, HIGH);
    Serial.println("[OK] Relay 4CH initialized (all OFF)");

    // Cau hinh chan Analog
    analogReadResolution(12);  // 12-bit ADC (0-4095)
    pinMode(SOIL_PIN, INPUT);
    pinMode(WATER_PIN, INPUT);
    pinMode(GAS_PIN, INPUT);

    // Ket noi WiFi
    Serial.printf("[..] Connecting to WiFi: %s\n", ssid);
    WiFi.begin(ssid, password);
    WiFi.setHostname("NhaKinh");

    int wifiAttempts = 0;
    while (WiFi.status() != WL_CONNECTED && wifiAttempts < 30) {
        delay(500);
        Serial.print(".");
        wifiAttempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[OK] WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("WiFi OK!");
        lcd.setCursor(0, 1);
        lcd.print(WiFi.localIP().toString());
    } else {
        Serial.println("\n[FAIL] WiFi connection failed!");
        // Tao Access Point de ket noi truc tiep
        WiFi.softAP("NhaKinh_AP", "12345678");
        Serial.printf("[OK] AP Mode - IP: %s\n", WiFi.softAPIP().toString().c_str());
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("AP: NhaKinh_AP");
        lcd.setCursor(0, 1);
        lcd.print(WiFi.softAPIP().toString());
    }

    // ==================== CAU HINH WEB SERVER ====================
    
    // Trang chu - phuc vu file HTML
    server.on("/", HTTP_GET, handleRoot);
    
    // API doc du lieu cam bien
    server.on("/sensors", HTTP_GET, handleSensors);
    
    // API dieu khien thiet bi
    server.on("/control", HTTP_GET, handleControl);
    
    // API doi che do Auto/Manual
    server.on("/mode", HTTP_GET, handleMode);
    
    // API cai dat nguong
    server.on("/threshold", HTTP_GET, handleThreshold);

    // Bat CORS cho moi request
    server.enableCORS(true);

    server.begin();
    Serial.println("[OK] Web Server started on port 80");
    Serial.println("====================================\n");

    delay(2000);
}

// ==================== HAM LOOP ====================
void loop() {
    // Xu ly request web
    server.handleClient();

    // Doc cam bien dinh ky
    if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
        lastSensorRead = millis();
        readSensors();
        autoControl();
        printSerial();
    }

    // Cap nhat LCD dinh ky
    if (millis() - lastLCDUpdate >= LCD_INTERVAL) {
        lastLCDUpdate = millis();
        updateLCD();
    }
}

// ==================== DOC CAM BIEN ====================
void readSensors() {
    // DHT22 - Nhiet do & Do am
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) temperature = t;
    if (!isnan(h)) humidity = h;

    // BH1750 - Anh sang (lux)
    float lux = lightMeter.readLightLevel();
    if (lux >= 0) lightLevel = lux;

    // Cam bien do am dat (Analog -> %)
    int soilRaw = analogRead(SOIL_PIN);
    soilMoisture = map(constrain(soilRaw, SOIL_WET, SOIL_DRY), SOIL_DRY, SOIL_WET, 0, 100);
    soilMoisture = constrain(soilMoisture, 0, 100);

    // Cam bien muc nuoc (Analog -> %)
    int waterRaw = analogRead(WATER_PIN);
    waterLevel = map(constrain(waterRaw, WATER_MIN, WATER_MAX), WATER_MIN, WATER_MAX, 0, 100);
    waterLevel = constrain(waterLevel, 0, 100);

    // MQ-2 Gas sensor (Analog -> ppm uoc luong)
    int gasRaw = analogRead(GAS_PIN);
    // Cong thuc don gian: scale gia tri ADC thanh ppm
    gasLevel = map(gasRaw, 0, 4095, 0, 1000);
    gasLevel = constrain(gasLevel, 0, 10000);
}

// ==================== DIEU KHIEN TU DONG ====================
void autoControl() {
    // Quat: bat khi nhiet do >= nguong cao, tat khi <= nguong thap
    if (fanAuto) {
        if (temperature >= threshTempHigh && !fanState) {
            setRelay(RELAY_FAN, true);
            fanState = true;
            Serial.println("[AUTO] Quat BAT - Nhiet do cao");
        } else if (temperature <= threshTempLow && fanState) {
            setRelay(RELAY_FAN, false);
            fanState = false;
            Serial.println("[AUTO] Quat TAT - Nhiet do on dinh");
        }
    }

    // May bom: bat khi do am dat <= nguong thap, tat khi >= nguong cao
    if (pumpAuto) {
        if (soilMoisture <= threshSoilLow && !pumpState) {
            setRelay(RELAY_PUMP, true);
            pumpState = true;
            Serial.println("[AUTO] May bom BAT - Dat kho");
        } else if (soilMoisture >= threshSoilHigh && pumpState) {
            setRelay(RELAY_PUMP, false);
            pumpState = false;
            Serial.println("[AUTO] May bom TAT - Dat du am");
        }
    }

    // Den LED: bat khi anh sang <= nguong thap, tat khi >= nguong cao
    if (ledAuto) {
        if (lightLevel <= threshLightLow && !ledState) {
            setRelay(RELAY_LED, true);
            ledState = true;
            Serial.println("[AUTO] Den LED BAT - Troi toi");
        } else if (lightLevel >= threshLightHigh && ledState) {
            setRelay(RELAY_LED, false);
            ledState = false;
            Serial.println("[AUTO] Den LED TAT - Du sang");
        }
    }

    // Coi: bat khi phat hien gas HOAC muc nuoc thap
    if (buzzerAuto) {
        bool gasAlert = gasLevel >= threshGasHigh;
        bool waterAlert = waterLevel <= threshWaterLow;
        
        if ((gasAlert || waterAlert) && !buzzerState) {
            setRelay(RELAY_BUZZER, true);
            buzzerState = true;
            if (gasAlert) Serial.println("[ALERT] Coi BAT - Phat hien gas!");
            if (waterAlert) Serial.println("[ALERT] Coi BAT - Muc nuoc thap!");
        } else if (!gasAlert && !waterAlert && buzzerState) {
            setRelay(RELAY_BUZZER, false);
            buzzerState = false;
            Serial.println("[AUTO] Coi TAT - Het canh bao");
        }
    }
}

// ==================== DIEU KHIEN RELAY ====================
void setRelay(int pin, bool on) {
    // Relay module Active LOW: LOW = ON, HIGH = OFF
    digitalWrite(pin, on ? LOW : HIGH);
}

// ==================== CAP NHAT LCD ====================
void updateLCD() {
    lcd.clear();
    switch (lcdPage) {
        case 0:
            lcd.setCursor(0, 0);
            lcd.print("Nhiet:");
            lcd.print(temperature, 1);
            lcd.print((char)223);  // Ky tu do
            lcd.print("C");
            lcd.setCursor(0, 1);
            lcd.print("DoAm:");
            lcd.print(humidity, 1);
            lcd.print("%");
            break;
        case 1:
            lcd.setCursor(0, 0);
            lcd.print("Dat:");
            lcd.print((int)soilMoisture);
            lcd.print("% ");
            lcd.print("Nuoc:");
            lcd.print((int)waterLevel);
            lcd.print("%");
            lcd.setCursor(0, 1);
            lcd.print("Sang:");
            lcd.print((int)lightLevel);
            lcd.print("lux");
            break;
        case 2:
            lcd.setCursor(0, 0);
            lcd.print("Gas:");
            lcd.print((int)gasLevel);
            lcd.print("ppm");
            lcd.setCursor(0, 1);
            lcd.print("B:");
            lcd.print(pumpState ? "ON " : "OFF");
            lcd.print("Q:");
            lcd.print(fanState ? "ON " : "OFF");
            lcd.print("D:");
            lcd.print(ledState ? "ON" : "OF");
            break;
    }
    lcdPage = (lcdPage + 1) % 3;
}

// ==================== IN SERIAL MONITOR ====================
void printSerial() {
    Serial.printf("[SENSOR] Temp=%.1fC | Hum=%.1f%% | Soil=%.0f%% | Light=%.0flux | Water=%.0f%% | Gas=%.0fppm\n",
                  temperature, humidity, soilMoisture, lightLevel, waterLevel, gasLevel);
    Serial.printf("[DEVICE] Pump=%s | Fan=%s | LED=%s | Buzzer=%s\n",
                  pumpState ? "ON" : "OFF", fanState ? "ON" : "OFF",
                  ledState ? "ON" : "OFF", buzzerState ? "ON" : "OFF");
}

// ==================== WEB SERVER HANDLERS ====================

// Trang chu: Gui noi dung HTML dashboard
// LUU Y: File HTML duoc luu trong SPIFFS hoac gui truc tiep
// Day la phien ban gui HTML tu bien (cho mo hinh nho)
// Voi du an lon, nen dung SPIFFS.
void handleRoot() {
    // Redirect den file index.html tren SPIFFS hoac gui inline
    // O day ta gui mot trang don gian redirect toi dashboard
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta charset='UTF-8'>";
    html += "<meta http-equiv='refresh' content='0; url=/sensors'>";
    html += "<title>Nha Kinh Thong Minh</title>";
    html += "</head><body>";
    html += "<p>Dang tai dashboard...</p>";
    html += "</body></html>";
    
    // NEU BAN DUNG SPIFFS: 
    // File index.html duoc upload len ESP32 SPIFFS
    // server.send(SPIFFS.open("/index.html", "r"), "text/html");
    
    server.send(200, "text/html", html);
}

// API: Tra ve du lieu cam bien + trang thai thiet bi dang JSON
void handleSensors() {
    StaticJsonDocument<512> doc;

    // Du lieu cam bien
    doc["temperature"] = round(temperature * 10.0) / 10.0;
    doc["humidity"] = round(humidity * 10.0) / 10.0;
    doc["soilMoisture"] = round(soilMoisture);
    doc["light"] = round(lightLevel);
    doc["waterLevel"] = round(waterLevel);
    doc["gas"] = round(gasLevel);

    // Trang thai thiet bi
    JsonObject devices = doc.createNestedObject("devices");
    devices["pump"] = pumpState;
    devices["fan"] = fanState;
    devices["led"] = ledState;
    devices["buzzer"] = buzzerState;

    // Che do dieu khien
    JsonObject modes = doc.createNestedObject("modes");
    modes["pump"] = pumpAuto ? "auto" : "manual";
    modes["fan"] = fanAuto ? "auto" : "manual";
    modes["led"] = ledAuto ? "auto" : "manual";
    modes["buzzer"] = buzzerAuto ? "auto" : "manual";

    // Nguong cai dat
    JsonObject thresh = doc.createNestedObject("thresholds");
    thresh["tempHigh"] = threshTempHigh;
    thresh["tempLow"] = threshTempLow;
    thresh["soilLow"] = threshSoilLow;
    thresh["soilHigh"] = threshSoilHigh;
    thresh["lightLow"] = threshLightLow;
    thresh["lightHigh"] = threshLightHigh;
    thresh["gasHigh"] = threshGasHigh;
    thresh["waterLow"] = threshWaterLow;

    String output;
    serializeJson(doc, output);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", output);
}

// API: Dieu khien bat/tat thiet bi
// VD: /control?device=pump&state=1
void handleControl() {
    String device = server.arg("device");
    int state = server.arg("state").toInt();

    String response = "{\"status\":\"ok\",\"device\":\"" + device + "\",\"state\":" + String(state) + "}";

    if (device == "pump" && !pumpAuto) {
        pumpState = state == 1;
        setRelay(RELAY_PUMP, pumpState);
        Serial.printf("[MANUAL] May bom %s\n", pumpState ? "BAT" : "TAT");
    } else if (device == "fan" && !fanAuto) {
        fanState = state == 1;
        setRelay(RELAY_FAN, fanState);
        Serial.printf("[MANUAL] Quat %s\n", fanState ? "BAT" : "TAT");
    } else if (device == "led" && !ledAuto) {
        ledState = state == 1;
        setRelay(RELAY_LED, ledState);
        Serial.printf("[MANUAL] Den LED %s\n", ledState ? "BAT" : "TAT");
    } else if (device == "buzzer" && !buzzerAuto) {
        buzzerState = state == 1;
        setRelay(RELAY_BUZZER, buzzerState);
        Serial.printf("[MANUAL] Coi %s\n", buzzerState ? "BAT" : "TAT");
    } else {
        response = "{\"status\":\"error\",\"message\":\"Device is in AUTO mode or invalid\"}";
    }

    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
}

// API: Doi che do Auto/Manual
// VD: /mode?device=pump&mode=auto
void handleMode() {
    String device = server.arg("device");
    String mode = server.arg("mode");
    bool isAuto = (mode == "auto");

    if (device == "pump") {
        pumpAuto = isAuto;
        Serial.printf("[MODE] May bom -> %s\n", isAuto ? "TU DONG" : "THU CONG");
    } else if (device == "fan") {
        fanAuto = isAuto;
        Serial.printf("[MODE] Quat -> %s\n", isAuto ? "TU DONG" : "THU CONG");
    } else if (device == "led") {
        ledAuto = isAuto;
        Serial.printf("[MODE] Den LED -> %s\n", isAuto ? "TU DONG" : "THU CONG");
    } else if (device == "buzzer") {
        buzzerAuto = isAuto;
        Serial.printf("[MODE] Coi -> %s\n", isAuto ? "TU DONG" : "THU CONG");
    }

    String response = "{\"status\":\"ok\",\"device\":\"" + device + "\",\"mode\":\"" + mode + "\"}";
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
}

// API: Cap nhat nguong tu dong
// VD: /threshold?tempHigh=35&tempLow=28
void handleThreshold() {
    if (server.hasArg("tempHigh"))  threshTempHigh  = server.arg("tempHigh").toFloat();
    if (server.hasArg("tempLow"))   threshTempLow   = server.arg("tempLow").toFloat();
    if (server.hasArg("soilLow"))   threshSoilLow   = server.arg("soilLow").toFloat();
    if (server.hasArg("soilHigh"))  threshSoilHigh  = server.arg("soilHigh").toFloat();
    if (server.hasArg("lightLow"))  threshLightLow  = server.arg("lightLow").toFloat();
    if (server.hasArg("lightHigh")) threshLightHigh = server.arg("lightHigh").toFloat();
    if (server.hasArg("gasHigh"))   threshGasHigh   = server.arg("gasHigh").toFloat();
    if (server.hasArg("waterLow"))  threshWaterLow  = server.arg("waterLow").toFloat();

    Serial.println("[CONFIG] Nguong da cap nhat:");
    Serial.printf("  TempHigh=%.1f TempLow=%.1f\n", threshTempHigh, threshTempLow);
    Serial.printf("  SoilLow=%.0f SoilHigh=%.0f\n", threshSoilLow, threshSoilHigh);
    Serial.printf("  LightLow=%.0f LightHigh=%.0f\n", threshLightLow, threshLightHigh);
    Serial.printf("  GasHigh=%.0f WaterLow=%.0f\n", threshGasHigh, threshWaterLow);

    String response = "{\"status\":\"ok\",\"message\":\"Thresholds updated\"}";
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
}
