# Homeware-for-ESP8266
A library for interact with Homeware's API from ESP8266 devices.

You can find Homeware's API and CMS in this GitHub repository: https://github.com/kikeelectronico/Homeware

# Auxiliar libraries

Homeware for ESP8266 need `ArduinoJson.h`, you must install it on your Arduino IDE. You can find this library in its Github repository https://github.com/bblanchon/ArduinoJson . Thanks bblanchon for this awesome JSON library.

Depending on the example you run, you may need:

- Adafruit_BMP280.h

# Quickstart

## Homeware api(char* id, char* host, WiFiClientSecure* client);

Instantiate a Homeware object. In this case is called `api` and it could be instantiated with two different configurations.

```
Homeware api(char* id, char* host, WiFiClientSecure* client);
```

or

```
Homeware api(char* id, char* host, char* key, WiFiClientSecure* client);
```
- `id` is the unique Device ID
- `host` is the API endpoint URL that you can find in the `Functions` section from Firebase Console.
- `key` is the `Key for authorization code`. You can find it in the `Settings` section from Homeware CMS.
- `client` is a pointer to an WiFiClientSecure object.

### Example

```
char* host = "[something]-[id].cloudfunctions.net";
char* id = "outlet";

WiFiClientSecure client;
Homeware api(id, host, &client);
```

## void getToken(bool refresh)

This method is used to get the tokens from Homeware. It receives refresh, a boolean param.

- Must be *false* if we want to authenticate using the authentication code. It is used when we haven't got any token stored in the ESP8266 memory. After calling this method the Homeware object will get an access token and a refresh token from Homeware API.

- Must be *true* if we want to authenticate using a refresh token. It is used for get a new access token when the Homeware objects got a refresh token from a previous call with a false value.


##### Important

Authorization_code is compose by the `id` and the `Key for authorization code` that you can change from Homeware CMS at the `settings` tab. If the device-id is `light` and yor key is `-code`, the authorization_code is:

```
light-code
```

## char* getJSON()

This method ask the Homeware API for the current device status. It return a JSON as char*.

## bool sendTrait(char* trait, char* value, char* vartype);

Change the value of any device trait on the database.

- `trait` is the trait you want to change.
- `value` is the new value.
- `vartype` is the value vartype. ('bool', 'int' or 'string')

### Example

For turn on the ceiling lamp whos device-id is `light`:

```
api.sendTrait("on","true","bool");
```
