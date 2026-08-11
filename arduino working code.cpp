#include <I2Cdev.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include "Wire.h"
#include "MPU6050_6Axis_MotionApps20.h"

// ================= WIFI ==================
const char* ssid = "Betic Lab";
const char* password = "Betic@2025";

WebSocketsServer webSocket = WebSocketsServer(81);  // WebSocket port

// ================= MPU ==================
MPU6050 mpu1(0x68);
MPU6050 mpu2(0x69);

bool dmpReady1 = false;
bool dmpReady2 = false;

uint16_t packetSize1;
uint16_t packetSize2;

Quaternion q;
VectorFloat gravity;
float ypr1[3];
float ypr2[3];

uint8_t fifoBuffer1[64];
uint8_t fifoBuffer2[64];

unsigned long lastSend = 0;

// =====================================================
void setup() {
  Serial.begin(115200);
  Wire.begin();

  // ----------- WiFi ----------
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());    // <=== YOUR IP (192.168.19.88)

  // ---------- WebSocket -------
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  // ---------- MPU1 ----------
  Serial.println("Init MPU1...");
  mpu1.initialize();
  if (mpu1.dmpInitialize() == 0) {
    mpu1.setDMPEnabled(true);
    dmpReady1 = true;
    packetSize1 = mpu1.dmpGetFIFOPacketSize();
    Serial.println("MPU1 Ready");
  }

  // ---------- MPU2 ----------
  Serial.println("Init MPU2...");
  mpu2.initialize();
  if (mpu2.dmpInitialize() == 0) {
    mpu2.setDMPEnabled(true);
    dmpReady2 = true;
    packetSize2 = mpu2.dmpGetFIFOPacketSize();
    Serial.println("MPU2 Ready");
  }
}

// =====================================================
void loop() {
  webSocket.loop();

  if (millis() - lastSend < 50) return;
  lastSend = millis();

  if (!dmpReady1 || !dmpReady2) return;

  if (mpu1.dmpGetCurrentFIFOPacket(fifoBuffer1)) {
    mpu1.dmpGetQuaternion(&q, fifoBuffer1);
    mpu1.dmpGetGravity(&gravity, &q);
    mpu1.dmpGetYawPitchRoll(ypr1, &q, &gravity);
  }

  if (mpu2.dmpGetCurrentFIFOPacket(fifoBuffer2)) {
    mpu2.dmpGetQuaternion(&q, fifoBuffer2);
    mpu2.dmpGetGravity(&gravity, &q);
    mpu2.dmpGetYawPitchRoll(ypr2, &q, &gravity);
  }

  char msg[160];
  sprintf(msg,
    "{\"mpu1\": {\"yaw\": %.2f, \"pitch\": %.2f, \"roll\": %.2f}, "
    "\"mpu2\": {\"yaw\": %.2f, \"pitch\": %.2f, \"roll\": %.2f}}",

    ypr1[0] * 180/M_PI,
    ypr1[1] * 180/M_PI,
    ypr1[2] * 180/M_PI,

    ypr2[0] * 180/M_PI,
    ypr2[1] * 180/M_PI,
    ypr2[2] * 180/M_PI
  );

  webSocket.broadcastTXT(msg);
}

// =====================================================
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  if (type == WStype_CONNECTED) Serial.println("Client Connected");
  if (type == WStype_DISCONNECTED) Serial.println("Client Disconnected");
}
