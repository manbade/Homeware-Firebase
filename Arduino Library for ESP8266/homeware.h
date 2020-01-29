#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>


class Homeware{
private:
  char _request[600];
  char _request_a[300];
  char _request_b[300];
  char* _host;
  char* _id;
  char* _key;
  char _ref[50];
  char _actual[50];
  char _state[50];
  char _json_c[200];
  long int _last_user_call_time;

  bool _smart_connection_enabled;
  char _delay[25];
  int _update_time;
  long int _last_smart_connection_time;
  char _update_json[200];

  WiFiClientSecure* _client;
  const int _httpsPort = 443;

public:

  char _code[50];
  char _token[41];
  char _refresh[41];

  Homeware(char* id, char* host, WiFiClientSecure* client);
  Homeware(char* id, char* host, char* key, WiFiClientSecure* client);
  void test();
  void getToken(bool refresh);
  void refreshToken();
  char* getJSON();
  bool sendTrait(char* trait, char* value, char* vartype);
  void smartConnectionBegin();
  void smartConnectionBegin(char* delay, int updateTime);
  void smartConnectionEnd();
};
