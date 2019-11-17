'use strict';

const functions = require('firebase-functions');
const {smarthome} = require('actions-on-google');
const util = require('util');
const admin = require('firebase-admin');
var crypto = require("crypto");
var XMLHttpRequest = require('xhr2');

// Initialize Firebase

try{
  var serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: functions.config()['system']['database']
  });
} catch (e) {
  admin.initializeApp();
}

const firebaseRef = admin.database().ref('/status/');

//API constants
const deviceAliveTimeout = 20000;

exports.read = functions.https.onRequest((req, res) =>{
  //Hardware data
  var id = req.query.id;
  var token = req.get("authorization").split(" ")[1] ? req.get("authorization").split(" ")[1] : req.get("Authorization").split(" ")[1];
  var agent = req.get("User-Agent").split(" ")[1];
  var param = req.query.param;
  var value = req.query.value;
  var vartype = req.query.vartype;

  //Change va
  if (vartype == "int"){
    value = parseInt(value);
  } else if (vartype == "bool") {
    if (value == "true"){
      value = true;
    } else {
      value = false;
    }
  }

  //Get tokenJSON from DDBB
  admin.database().ref('/token/').once('value')
  .then(function(snapshot) {
    var tokenJSON = snapshot.val();

    //Verify the token
    if (token == tokenJSON[agent]["access_token"]["value"]){
      //Save the new timestamp
      var current_date = new Date().getTime();
      admin.database().ref('/alive/').child(id).update({
        timestamp: current_date,
      });
      //Save the value
      if (param){
        var input_json = {}
        input_json[param] = value;
        admin.database().ref('/status/').child(id).update(input_json);
      }
      //Read state and send a response back
      firebaseRef.child(id).once('value').then(function(snapshot) {
        //var status = ";" + snapshot.val() + ";";
        res.status(200).json(snapshot.val());
      });

    } else { //If the token wasn't correct
      console.log("Hardware used an incorrect access token");
      res.status(200).send("Bad token");
    }
  });
});

// TOKEN HANDLERS
//Generate a new token
function tokenGenerator(agent, type){
  //Generate a random token
  var token = crypto.randomBytes(20).toString('hex');

  //Verify specials agents
  if (agent.indexOf("+http://www.google.com/bot.html") > 0){
    agent = "google";
  } else if (agent == "OpenAuth"){
    agent = "google";
  }

  var current_date = new Date().getTime();

  //Save the token in the DDBB
  if (type == "access_token"){
    admin.database().ref('/token/').child(agent).child("access_token").update({
        value: token,
        timestamp: current_date,
    });
  } else if (type == "authorization_code"){
    admin.database().ref('/token/').child(agent).child("authorization_code").update({
        value: token,
        timestamp: current_date,
    });
  } else if (type == "refresh_token"){
    admin.database().ref('/token/').child(agent).child("refresh_token").update({
        value: token,
        timestamp: current_date,
    });
  }

  return token;

}

// GOOGLE ENDPOINTS
//Verify Google client_id and check the user account
exports.auth = functions.https.onRequest((request, response) => {
  //Get the tokens and ids from DDBB
  admin.database().ref('/token/').once('value')
  .then(function(snapshot) {
    var tokenJSON = snapshot.val();
    //Google data
    var client_id = request.query.client_id;

    //Verify the client_id from Google. (¿Are you Google?)
    if (client_id == tokenJSON["google"]["client_id"]){
      //Get a new authorization code for Google
      var code = tokenGenerator("google", "authorization_code");
      //Send the authorization code to Google by redirecting the user browser
      const responseurl = util.format('%s?code=%s&state=%s',
      decodeURIComponent(request.query.redirect_uri), code,
      request.query.state);
      //return response.redirect(responseurl);

      response.status(200).send("<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1, shrink-to-fit=no'><link rel='stylesheet' href='https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css' integrity='sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T' crossorigin='anonymous'><link href='https://fonts.googleapis.com/css?family=Ramabhadra&display=swap' rel='stylesheet'><title>Google Home</title></head><body><nav class='navbar navbar-expand-lg navbar-light bg-light'><a class='navbar-brand'>Homeware</a></nav><div id='grid' style='margin-top: 20px;'><div class='row'><div class='col'><div class='container p-3 mb-2 bg-light text-dark'><h2>Enlazar dispositivo</h2><p><a class='btn btn-primary' href='" + responseurl + "'>Pulsa aquí para enlazar</a></p></div></div></div></div><div id='toastBoard' aria-live='polite' aria-atomic='true' style='position:absolute; bottom:0; min-height: 200px;width: 100%;'><div id='toastBoardPosition' style='position: absolute; bottom: 0; right: 0; margin-right: 20px; margin-bottom: 20px;'></div></div><script src='https://code.jquery.com/jquery-3.3.1.slim.min.js' integrity='sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo' crossorigin='anonymous'></script><script src='https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js' integrity='sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM' crossorigin='anonymous'></script></body></html>");
    } else {
      response.status(200).send("Algo ha ido mal en la autorización");
    }
  });

});

//Verify Google's authorization code and send the token
exports.token = functions.https.onRequest((request, response) => {

  //Google data
  var grantType = request.query.grant_type ? request.query.grant_type : request.body.grant_type;
  var client_id = request.query.client_id ? request.query.client_id : request.body.client_id;
  var client_secret = request.query.client_secret ? request.query.client_secret : request.body.client_secret;
  if (grantType == "authorization_code") {
    var code = request.query.code ? request.query.code : request.body.code;
  } else {
    var code = request.query.refresh_token ? request.query.refresh_token : request.body.refresh_token;
  }
  var agent = request.get("User-Agent");
  if (code === undefined){
    code = request.get("code");
  }
  if (grantType === undefined){
    grantType = request.get("grant_type");
  }

  //Verify specials agents
  if (agent.indexOf("+http://www.google.com/bot.html") > 0){
    agent = "google";
  } else if (agent == "OpenAuth"){
    agent = "google";
  }

  //Get the tokens and ids from DDBB
  var tokenJSON
  admin.database().ref('/token/').once('value')
  .then(function(snapshot) {
    tokenJSON = snapshot.val();
    return admin.database().ref('/settings/').once('value');
  })
  .then(function(settingsSnapshot) {
    var settingsJSON = settingsSnapshot.val();

    //Verify the code
    if (code == tokenJSON[agent][grantType]["value"]){

      //Tokens lifetime
      const secondsInDay = 86400;
      //Create a new token for Google
      var access_token = tokenGenerator(agent, "access_token");
      //Compose the JSON response for Google
      let obj;
      if (grantType === 'authorization_code') {
        //Create the refresh token
        var refresh_token = tokenGenerator(agent, "refresh_token");
        obj = {
          token_type: 'bearer',
          access_token: access_token,
          refresh_token: refresh_token,
          expires_in: secondsInDay,
        };
      } else if (grantType === 'refresh_token') {
        obj = {
          token_type: 'bearer',
          access_token: access_token,
          refresh_token: code,
          expires_in: secondsInDay,
        };
      }
      //Clear authorization_code if autoAuthentication is not permited
      if (settingsJSON.autoAuthentication == false || agent == "google"){
        admin.database().ref('/token/').child(agent).child("authorization_code").update({
            value: "-",
        });
      }
      //Create an alert on the status register
      var current_date = new Date().getTime();
      var text = "Se ha conectado un nuevo dispositivo <br> <b>Agente</b>: " + agent + " <br> <b>Autenticación</b>: " + grantType;
      admin.database().ref('/events/unread/').child(current_date).update({
        timestamp: current_date,
        title: "Conexión - Info",
        text: text,
        read: false,
      });
      response.status(200).json(obj);
    } else {
      let obj;
      obj = {
        error: "invalid_grant"
      };
      //Request for manual authorization
      admin.database().ref('/token/').child(agent).child(grantType).update({ requestManualAuthorization: true });
      //Save an event
      var current_date = new Date().getTime();
      var text = "Se ha rechazado a un dispositivo <br> <b>Agente</b>: " + agent + " <br> <b>Autenticación</b>: " + grantType + " <br> <b>Code</b>: " + code;
      admin.database().ref('/events/unread/').child(current_date).update({
        timestamp: current_date,
        title: "Conexión - ALERT",
        text: text,
        read: false,
      });
      response.status(400).json(obj);
    }
  });

});

//Smarthome APP
const app = smarthome({
  debug: true,
  key: functions.config()['system']['api-key'],
});

//Google ask for the devices' list
app.onSync((body, headers) => {
  //Google data
  var token = headers.authorization.split(" ")[1];
  var agent = headers["user-agent"];

  //Verify specials agents
  if (agent.indexOf("+http://www.google.com/bot.html") > 0)
    agent = "google";
  else if (agent == "OpenAuth")
    agent = "google";

  //Get the tokens and ids from DDBB
  return admin.database().ref('/token/').once('value')
  .then(function(snapshot) {
    var tokenJSON = snapshot.val();

    //Verify the token
    if (token == tokenJSON[agent]["access_token"]["value"]){
      //Get the list of devices in JSON
      return admin.database().ref('/devices/').once('value')
      .then(function(snapshot) {
        var devicesJSON = snapshot.val();

        //Send the JSON back to Google
        return {
          requestId: body.requestId,
          payload: {
            agentUserId: '123',
            devices: devicesJSON,
          },
        };

      });
    }
  });

});

//Google ask for the devices' states
app.onQuery((body, headers) => {
  //Google data
  var token = headers.authorization.split(" ")[1];
  var agent = headers["user-agent"];

  //Verify specials agents
  if (agent.indexOf("+http://www.google.com/bot.html") > 0)
    agent = "google";
  else if (agent == "OpenAuth")
    agent = "google";

  //Get the tokens and ids from DDBB
  return admin.database().ref('/token/').once('value')
  .then(function(snapshot) {
    var tokenJSON = snapshot.val();

    //Verify the token
    if (token == tokenJSON[agent]["access_token"]["value"]){
      //Update online status
      updatestates();
      //Get the list of online status in JSON
      return admin.database().ref('/status/').once('value').then(function(snapshot) {
        var statusJSON = snapshot.val();

        //Send the JSON back to Google
        return {
          requestId: body.requestId,
          payload: {
            devices: statusJSON
          }
        };
      });
    }
  });


});

//Google want to change something
app.onExecute((body, headers) => {
  //Google data
  var token = headers.authorization.split(" ")[1];
  var agent = headers["user-agent"];

  //Verify specials agents
  if (agent.indexOf("+http://www.google.com/bot.html") > 0)
    agent = "google";
  else if (agent == "OpenAuth")
    agent = "google";

  //Get the tokens and ids from DDBB
  return admin.database().ref('/token/').once('value')
  .then(function(snapshot) {
    var tokenJSON = snapshot.val();

    //Verify the accessn token
    if (token == tokenJSON[agent]["access_token"]["value"]){
      //Get the list of online status in JSON
      return admin.database().ref('/status/').once('value').then(function(snapshot) {
        var statusJSON = snapshot.val();

        //Compose the JSON for Google
        const {requestId} = body;
        const payload = {
          commands: [{
            ids: [],
            status: 'SUCCESS',
            states: {
            },
          }],
        };
        for (const input of body.inputs) {
          for (const command of input.payload.commands) {
            for (const device of command.devices) {
              const deviceId = device.id;
              payload.commands[0].ids.push(deviceId);
              for (const execution of command.execution) {
                const execCommand = execution.command;
                const {params} = execution;

                payload.commands[0].states.online = statusJSON[deviceId].online;

                firebaseRef.child(deviceId).update(params);
                payload.commands[0].states = params;
              }
            }
          }
        }

        //Send the JSON back to Google
        return {
          requestId: requestId,
          payload: payload,
        };
      });
    } //else {}
  });

});

//Smarthome endpoint
exports.smarthome = functions.https.onRequest(app);

//We ask Google for a Sync request
exports.requestsync = functions.https.onRequest((request, response) => {

  console.info('Request SYNC for user');
  app.requestSync('123')
    .then((res) => {
      console.log('Request sync completed');
      response.json(res.data);
    }).catch((err) => {
      console.error(err);
    });

    response.status(200).send("Done");

});

//We send devices to Google 'on change'
exports.reportdevices = functions.database.ref('/devices/').onUpdate(async (change, context) => {
  const snapshot = change.after.val();

  //Send an HTTPS request
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      console.log("Request SYNC success!");
    }
  };
  xhttp.open("POST", functions.config()['system']['api-uri'] + "/requestsync", true);
  xhttp.send();
});

//Update online states
function updatestates() {

  //Get timestamp values
  admin.database().ref('/alive/').once('value').then(function(snapshot) {
    var aliveJSON = snapshot.val();

    //Analize the JSON
    for (const device of Object.keys(aliveJSON)){
      var current_date=new Date().getTime();
      var timestamp = aliveJSON[device].timestamp;
      var online = true;

      //Verify if the device is online
      if (current_date - timestamp > deviceAliveTimeout){
        online = false;
      }
      //Change the value in the DDBB
      admin.database().ref('/status/').child(device).update({
        online: online,
      });
    }

  });

  return "Done";

}

//Expire tokens
function expireTokens(){

  //Get timestamp values
  admin.database().ref('/token/').once('value').then(function(snapshot) {
    var tokenJSON = snapshot.val();
    var accessTokenExpireTime = 10;

    //Analize the JSON
    for (const device of Object.keys(tokenJSON)){
      var current_date=new Date().getTime();

      var toCheck = ["access_token", "authorization_code"];
      var expireTime = [86400000, 20000];

      for (var i = 0; i < toCheck.length; i++){
        //Verify access token
        var timestamp = tokenJSON[device][toCheck[i]].timestamp;
        if (current_date - timestamp > expireTime[i]){
          if (device == "google"){
            //Change the value in the DDBB
            admin.database().ref('/token/').child(device).child(toCheck[i]).update({
              value: "-",
            });
          }
        }
      }

    }

  });

  return "Done";

}

//Verify rules
function verifyRules(){
  var status = {}
  admin.database().ref('/status/').once('value')
    .then(function(statusSnapshot){
      status = statusSnapshot.val();
      return admin.database().ref('/rules/').once('value')
    })
    .then(function(rulesSnap) {
      var rules = rulesSnap.val();
      Object(rules).forEach(function(rule){
        //Time
        var d = new Date();
        var h = d.getHours();
        var m = d.getMinutes();

        //Detect the kind of triger (simple or multiple)
        var ruleKeys = Object.keys(rule);
        var amountRules = 1;
        var verified = 0;
        var triggers = [];
        if (ruleKeys.includes("triggers")){
          console.log('yes');
          amountRules = Object.keys(rule.triggers).length;
          triggers = rule.triggers;
        } else {
          console.log('no');
          triggers.push(rule.trigger);
        }
        console.log(amountRules);

        triggers.forEach(function(trigger){
          //Verify operators
          if(trigger.operator == 1 && status[trigger.id][trigger.param] == trigger.value){
            verified++; //Equal
          } else if(trigger.operator == 2 && status[trigger.id][trigger.param] < trigger.value){
            verified++; //General less than
          } else if(trigger.operator == 3 && status[trigger.id][trigger.param] > trigger.value){
            verified++; //General greather than
          } else if(trigger.operator == 4 && h == parseInt(trigger.value.split(':')[0], 10) && m == parseInt(trigger.value.split(':')[1], 10)){
            verified++; //Time greather than
          }
        });
        console.log(verified);
        if(verified == amountRules){

          Object(rule.targets).forEach(function(target){
            var json = {};
            json[target.param] = target.value;
            admin.database().ref().child("status").child(target.id).update(json);
          });
        }
      });
    });
}

exports.cron = functions.https.onRequest((request, response) => {
  updatestates();
  expireTokens();
  verifyRules();
  response.status(200).send("Done");
});

//Rules execution
exports.rules = functions.database.ref('/status/').onUpdate(async (change, context) => {
  verifyRules();
  console.log("Done");
});

exports.apitime = functions.https.onRequest((request, response) => {
  var d = new Date();
  var h = d.getHours();
  var m = d.getMinutes();
  response.status(200).send(h + ':' + m);
});
