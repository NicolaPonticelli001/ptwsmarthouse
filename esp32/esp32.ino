#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

AsyncWebServer server(80);
String jsonStr = "{}";

//AP credentials
const char* APssid = "esp32-access-point";
const char* APpassword = "12345678";

//Station Wifi network credentials. Get these ones from config.txt
String STssid = "";
String STpassword = "";

int wifiScan = 0;
bool startWifiScan = false;
int statusWifiNumber = 0;
bool connectWifi = false;
bool hasWifiConnectionStart = false;

unsigned long int startMillis = 0;
const unsigned long delayValue = 3000;

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
    if (WiFi.status() == 3) {
      request -> redirect("/credentials");
    }
    request->send(SPIFFS, "/webserver/network.html");
  });
  server.on("/credentials", HTTP_ANY, [](AsyncWebServerRequest *request){
    if (WiFi.status() == 3) request->send(SPIFFS, "/webserver/credentials.html");
    else request->redirect("/");
  });
  server.on("/house", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/house.html");
  });

  server.on("/style.css", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/style.css");
  });

  server.on("/script.js", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/script.js");
  });
  server.on("/classes.js", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/classes.js");
  });
  server.on("/network.js", HTTP_ANY, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/webserver/network.js");
  });

  //Get the list of wifi networks
  server.on("/networkscan", HTTP_POST, [](AsyncWebServerRequest *request){
    /*Serial.print("Before send: ");
    Serial.println(jsonStr);*/
    request->send(200, "application/json", jsonStr);
    startWifiScan = true;
  });

  //Take the given ssid and password, then connect to wifi network.
  //If the credentials are valid then the user will be redirected to the second step, otherwise
  //he will be redirected to the network scan page with given Get parameters to show the error
  server.on("/connectToNetwork", HTTP_POST, [](AsyncWebServerRequest *request){
    String statusWifiStr = "";
    STssid = request->arg("ssid");
    STpassword = request->arg("password");
    Serial.println("Request");
    Serial.println(STssid);
    Serial.println(STpassword);
    switch (statusWifiNumber) {
      case 0:                               //WL_IDLE_STATUS
        statusWifiStr = "progress";
        break;
      case 6:                               //WL_DISCONNECTED
        statusWifiStr = "progress";
        break;
      case 1:
        statusWifiStr = "network not found";
        break;
      case 3:                               //WL_CONNECTED
        statusWifiStr = "success";
        break;
      case 4:                               //WL_CONNECT_FAILED
        statusWifiStr = "fail";
        break;
      default:
        statusWifiStr = String(statusWifiNumber);
        break;
    }

    request->send(200, "text/plain", statusWifiStr);
    if (!hasWifiConnectionStart) connectWifi = true;
    if (hasWifiConnectionStart && (statusWifiNumber != 6 && statusWifiNumber !=0)) {
      statusWifiNumber = 0;
      hasWifiConnectionStart = false;
    }
  });

  server.on("/backToNetworkScan", HTTP_GET, [](AsyncWebServerRequest *request){
    WiFi.disconnect();
    request -> redirect("/");
  });

  server.on("/accountCredentials", HTTP_POST, [](AsyncWebServerRequest *request){
    
    request -> send(200, "text/plain", "risposta test");
  });
  
  server.begin();
  startMillis = millis();
}

void loop() {
  if (startWifiScan) {
      wifiScan = WiFi.scanNetworks();
      jsonStr = "{";
      jsonStr += "\"total\":" + String(wifiScan);
      for (int i = 0; i < wifiScan; i++) {
        jsonStr += ",\"" + String(i) + "\":{";
        jsonStr += "\"ssid\":\"" + String(WiFi.SSID(i)) + "\"";
        jsonStr += ",\"rssi\":" + String(WiFi.RSSI(i));
        jsonStr += ",\"auth\":" + String(WiFi.encryptionType(i));
        jsonStr += "}";
      }
      jsonStr += "}";
      startMillis = millis();
      startWifiScan = false;
    }

  if (connectWifi) {
    hasWifiConnectionStart = true;
    statusWifiNumber = WiFi.begin(STssid.c_str(), STpassword.c_str());
    connectWifi = false;
  }

  if (hasWifiConnectionStart && (statusWifiNumber == 0 || statusWifiNumber == 6)) {
    if (millis() - startMillis >= delayValue) {
      statusWifiNumber = WiFi.status();
      //Serial.println(statusWifiNumber);
    }
  }
}
