#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

AsyncWebServer server(80);

//AP credentials
const char* APssid = "esp32-access-point";
const char* APpassword = "12345678";

//Station Wifi network credentials. Get these ones from config.txt
char* STssid;
char* STpassword;

unsigned long int startMillis = 0;
const unsigned long delayValue = 3000;

bool scanWifiNetworks = false;

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(APssid, APpassword);
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

  server.on("/networkscan", HTTP_POST, [](AsyncWebServerRequest * request) {
    String jsonStr = "{";
    int n = WiFi.scanComplete();
    if (n == -2) {
      WiFi.scanNetworks(true);
    } else {
      if (n > 0) {
        jsonStr += "\"total\":" + String(n);
        for (int i = 0; i<n; i++) {
          jsonStr += ",\"" + String(i) + "\":{";
          jsonStr += "\"ssid\":\"" + String(WiFi.SSID(i)) + "\"";
          jsonStr += ",\"rssi\":" + String(WiFi.RSSI(i));
          jsonStr += ",\"auth\":" + String(WiFi.encryptionType(i));
          jsonStr += "}";
        }
      }
      WiFi.scanDelete();
      if(WiFi.scanComplete() == -2){
        WiFi.scanNetworks(true);
      }
      jsonStr += "}";
      request -> send(200, "application/json", jsonStr);
      jsonStr = "";
    }
    Serial.println(n);
  });
  
  server.begin();
  startMillis = millis();
}

void loop() {
  
}
