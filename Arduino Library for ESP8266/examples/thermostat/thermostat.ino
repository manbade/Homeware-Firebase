#include <homeware.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <Wire.h>

#include <DHT.h>
#define DHTTYPE DHT22
#define DHTPIN  D1
DHT dht(DHTPIN, DHTTYPE, 22); // for ESP8266 use dht(DHTPIN, DHTTYPE, 11)
float temperature = 21;
float humidity = 80;

//Config this section
const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";
char* host = "us-central1-[id].cloudfunctions.net";
char* id = "thermostat";

//General global variables
long int time_value = 0;
int outputEEPROM = 10;
char json_c[300];
char mode[30];
int temperatureSetPoint = 0;

float thermostatHumidityAmbient = 0;
float thermostatTemperatureAmbient = 0;
float thermostatTemperatureSetpoint = 0;
float thermostatTemperatureSetpointHigh = 0;
float thermostatTemperatureSetpointLow = 0;

//Objects
WiFiClientSecure client;
DHT dht(DHTPIN, DHTTYPE, 22); // for ESP8266 use dht(DHTPIN, DHTTYPE, 11)
Homeware api(id, host, &client);

void setup() {
  //Set output pin using last state from the EEPROM
  pinMode(D0, OUTPUT);
  bool lastState = EEPROM.read(outputEEPROM);
  digitalWrite(D0, lastState);
  //Connect to a WiFI network
  Serial.begin(115200);
  Serial.println();
  Serial.print(F("Connecting to "));
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(F(""));
  Serial.println(F("WiFi connected"));
  Serial.println(F("IP address: "));
  Serial.println(WiFi.localIP());
  Serial.print(F("Connecting to "));
  Serial.println(host);
  //Get access token from the API
  Serial.println(F("Getting token"));
  api.getToken(false);

  dht.begin();

}

void loop() {

  //Check WiFi status
  if (WiFi.status() == WL_DISCONNECTED) {
    Serial.println("WiFi connection lost");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("WiFi connection recovered");
  }

  //Get state or token
  if (millis() - time_value > 2000){  
    // this code sends and read each 2 seconds to firebase.
    // This device can send the temperature 1 minute or longer and only send the preset when change.
    //Send temperature
    temperature = dht.readTemperature(false);
    char temp_char[5];
    dtostrf(temperature, 2, 2, temp_char);
    api.sendTrait("thermostatTemperatureAmbient", temp_char, "char");
    humidity = dht.readHumidity();
    char hum_char[5];
    dtostrf(humidity, 2, 2, hum_char);
    api.sendTrait("thermostatHumidityAmbient", hum_char, "char");
    /*
    . Send code for change temperature limit values
    . when press up or down setting temperature buttons in the device i.e.
    .
    .
    */

    
    //Get mode and temperature
    strcpy(json_c, api.getJSON());
    StaticJsonDocument<300> doc;
    
    // for testing mode and understand the jcon output
    Serial.println(json_c);

    DeserializationError error = deserializeJson(doc, json_c);
    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.c_str());
    } else {
      //strcpy(mode, doc["thermostatMode"]); // the json returns "online":true or "online":false but never "thermostatMode" this cause reset
      //temperatureSetPoint = doc["thermostatTemperatureSetpoint"];
      thermostatTemperatureAmbient = doc["thermostatTemperatureAmbient"];
      thermostatHumidityAmbient = doc["thermostatHumidityAmbient"];
      thermostatTemperatureSetpoint = doc["thermostatTemperatureSetpoint"];
      // SetPoint high and Low are not interesting for me
      // this could be useful when triggering a hot and cold HVAC unit i.e.

      Serial.print("Humedad : ");
      Serial.println(thermostatHumidityAmbient);
      Serial.print("Temperatura : ");
      Serial.println(thermostatTemperatureAmbient);
      Serial.print("Preset : ");
      Serial.println(thermostatTemperatureSetpoint);
    }
    time_value = millis();
  }

}
