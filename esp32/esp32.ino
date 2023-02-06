#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

AsyncWebServer server(80);

const char* ssid = "esp32-access-point";
const char* password = "12345678";

unsigned long int startMillis = 0;
const unsigned long delayValue = 3000;

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect();
  WiFi.softAP(ssid, password);
  Serial.println();
  Serial.print("IP Address: ");
  Serial.println(WiFi.softAPIP());

  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  server.on("/", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/index.html");
  });

  server.on("/style.css", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/style.css");
  });

  server.on("/script.js", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/script.js");
  });
  
  server.begin();
  startMillis = millis();
}

void loop() {
  if (startMillis - millis() >= delayValue) {
    int n = WiFi.scanNetworks();
    Serial.println("scan done");
    if (n == 0) {
        Serial.println("no networks found");
    } else {
      Serial.print(n);
      Serial.println(" networks found");
      for (int i = 0; i < n; ++i) {
        // Print SSID and RSSI for each network found
        Serial.print(i + 1);
        Serial.print(": ");
        Serial.print(WiFi.SSID(i));
        Serial.print(" (");
        Serial.print(WiFi.RSSI(i));
        Serial.print(")");
        Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?" ":"*");
      }
    }
    Serial.print("Elapsed: ");
    Serial.println(startMillis - millis());
    Serial.println("");

    startMillis = millis();
  }
}
