#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include "MPU6050_6Axis_MotionApps20.h"

// --------- WiFi Credentials ----------
const char* ssid = "BAKRE_4G";
const char* password = "nahimilega";

// --------- WebSocket Server ----------
WebSocketsServer webSocket = WebSocketsServer(81);

// --------- MPU6050 ----------
MPU6050 mpu1(0x68);
MPU6050 mpu2(0x69);

bool dmpReady1 = false, dmpReady2 = false;
uint16_t packetSize1, packetSize2;

uint8_t fifoBuffer1[64];
uint8_t fifoBuffer2[64];

Quaternion q1, q2;
VectorFloat gravity1, gravity2;
float ypr1[3], ypr2[3];

void setup() {
  Serial.begin(115200);
  Wire.begin();

  // ---- WiFi Connection ----
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // ---- Start WebSocket ----
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  // ---- MPU1 ----
  Serial.println("Initializing MPU1...");
  mpu1.initialize();
  if (mpu1.dmpInitialize() == 0) {
    mpu1.setDMPEnabled(true);
    packetSize1 = mpu1.dmpGetFIFOPacketSize();
    dmpReady1 = true;
    Serial.println("MPU1 READY");
  } else {
    Serial.println("MPU1 FAILED!");
  }

  // ---- MPU2 ----
  Serial.println("Initializing MPU2...");
  mpu2.initialize();
  if (mpu2.dmpInitialize() == 0) {
    mpu2.setDMPEnabled(true);
    packetSize2 = mpu2.dmpGetFIFOPacketSize();
    dmpReady2 = true;
    Serial.println("MPU2 READY");
  } else {
    Serial.println("MPU2 FAILED!");
  }
}

void loop() {
  webSocket.loop();

  if (dmpReady1 && mpu1.getFIFOCount() >= packetSize1) {
    mpu1.getFIFOBytes(fifoBuffer1, packetSize1);
    mpu1.dmpGetQuaternion(&q1, fifoBuffer1);
    mpu1.dmpGetGravity(&gravity1, &q1);
    mpu1.dmpGetYawPitchRoll(ypr1, &q1, &gravity1);
  }

  if (dmpReady2 && mpu2.getFIFOCount() >= packetSize2) {
    mpu2.getFIFOBytes(fifoBuffer2, packetSize2);
    mpu2.dmpGetQuaternion(&q2, fifoBuffer2);
    mpu2.dmpGetGravity(&gravity2, &q2);
    mpu2.dmpGetYawPitchRoll(ypr2, &q2, &gravity2);
  }

  // -------- SEND JSON TO WEBPAGE ---------
  String json = "{";
  json += "\"mpu1\":{";
  json += "\"yaw\":" + String(ypr1[0] * 180 / M_PI) + ",";
  json += "\"pitch\":" + String(ypr1[1] * 180 / M_PI) + ",";
  json += "\"roll\":" + String(ypr1[2] * 180 / M_PI);
  json += "},";

  json += "\"mpu2\":{";
  json += "\"yaw\":" + String(ypr2[0] * 180 / M_PI) + ",";
  json += "\"pitch\":" + String(ypr2[1] * 180 / M_PI) + ",";
  json += "\"roll\":" + String(ypr2[2] * 180 / M_PI);
  json += "}";

  json += "}";

  webSocket.broadcastTXT(json);
  delay(100);
}

// WebSocket Events
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.println("Web Client Connected!");
  }
}
