firebase.initializeApp(config);

firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser){
    console.log('Logged in');
  } else {
    console.log('Not logged in');
    window.location.href = "/cms/login/";
  }
});

// Get a statusRef from the database service
var statusRef = firebase.database().ref().child('status');
var aliveRef = firebase.database().ref().child('alive');
var tokensRef = firebase.database().ref().child('token');
var devicesRef = firebase.database().ref().child('devices');
var rulesRef = firebase.database().ref('rules');


rulesRef.on('value', snap => {

    if (getParameterByName("n")){
      var n = parseInt(getParameterByName("n"));
      var rule = snap.val()[n];
      var triggerType = "device";
      //Get the vector index
      document.getElementById("n").value = getParameterByName("n");
      //Show the correct containers
      document.getElementById('target').style.visibility = "visible";
      document.getElementById('deviceTriggeredButton').style.visibility = "hidden";
      document.getElementById('deviceTriggeredButton').style.width = "0px";
      document.getElementById('timeTriggeredButton').style.visibility = "hidden";
      document.getElementById('timeTriggeredButton').style.width = "0px";

      //Detect the kind of triger (simple or multiple)
      var ruleKeys = Object.keys(rule);
      var amountRules = 1;
      var verified = 0;
      var triggers = [];
      if (ruleKeys.includes("triggers")){
        amountRules = Object.keys(rule.triggers).length;
        triggers = rule.triggers;
        //Show containers
        $('#deviceTriggered').collapse('show');
        document.getElementById('triggerType').value = 'device';
      } else {
        triggers.push(rule.trigger);
        //Show the correct container
        if (rule.trigger.id == "time"){
          $('#timeTriggered').collapse('show');
          var time = rule.trigger.value.split(':');
          document.getElementById('triggerType').value = 'time';
          document.getElementById('hour').value = time[0];
          document.getElementById('minute').value = time[1];
          //Verify if weekDays exists
          var weekDays = time.length == 3 ? time[2] : '';
          var weekDaysOptions = '';
          var week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thuerday', 'Friday', 'Saturday'];
          for(var i = 0; i < 7; i++){
            var selected = weekDays.includes(String(i)) ? 'selected' : '';
            weekDaysOptions += '<option ' + selected + ' value="' + i + '">' + week[i] + '</option>'
          }
          document.getElementById('weekDays').innerHTML = weekDaysOptions;
          triggerType = "time";
        } else {
          $('#deviceTriggered').collapse('show');
          document.getElementById('triggerType').value = 'device';

        }
      }

      //Read the status for the relations between id and params
      statusRef.once('value', statusSnap => {
        var generalStatus = statusSnap.val();

        //Select the trigger's data
        devicesRef.once('value', devicesSnap => {
          var devices = {};
          //Get a relation between id and names
          Object(devicesSnap.val()).forEach(function(device){
            devices[device.id] = device.name.nicknames[0];
          });
          //Create the list of ids
          var generalStatus = statusSnap.val();
          var selectHTML = '<option>Selecct the trigger...</option>';
          Object.keys(generalStatus).forEach(function(id){
            selectHTML += '<option value="' + id + '">' + devices[id] + '</option>';
          });

          //Create the triggers by device
          if(triggerType == "device"){
            triggerId.innerHTML = selectHTML;
            var operator = ['','=','<','>','='];
            var triggerHTML = '';
            Object(triggers).forEach(function(trigger){
              //Device or Device to device triggered
              var value = trigger.value;
              if (String(value).includes('>')){
                var temp = value.split('>');
                value = '<b>' + devices[temp[0]] + '</b>(' + getParamCoolName(temp[1]) + ')';
              }
              triggerHTML += composeTrigger(devices[trigger.id], trigger.id, getParamCoolName(trigger.param), operator[trigger.operator], value)
            });
            badge_triggers_container.innerHTML = triggerHTML;
            document.getElementById("availableTriggers").value = JSON.stringify(triggers);
          }

          //Create the targets
          targetId.innerHTML = selectHTML;
          var targetHTML = '';
          Object(rule.targets).forEach(function(target){
            targetHTML += composeTarget(devices[target.id], target.id, getParamCoolName(target.param), target.value)
          });
          badge_targets_container.innerHTML = targetHTML;
          document.getElementById("availableTargets").value = JSON.stringify(rule.targets);
        });
      });


    } else {  //New rule
      statusRef.once('value', statusSnap => {
        devicesRef.once('value', devicesSnap => {
          var devices = {};
          console.log(devicesSnap.val());
          //Get a relation between id and names
          Object(devicesSnap.val()).forEach(function(device){
            devices[device.id] = device.name.nicknames[0];
          });
          //Create the list items
          var generalStatus = statusSnap.val();
          var selectHTML = '<option>Selecct the trigger...</option>';
          Object.keys(generalStatus).forEach(function(id){
            selectHTML += '<option value="' + id + '">' + devices[id] + '</option>';
          });

          triggerId.innerHTML = selectHTML;
          targetId.innerHTML = selectHTML;
        });
      });
      //Assign a vector index
      if(snap.val()){
        document.getElementById("n").value = snap.val().length;
      } else {
        document.getElementById("n").value = 0;
      }
    }

});

triggerId.addEventListener('change', function(){
  statusRef.once('value', statusSnap => {
    var generalStatus = statusSnap.val();
    var selectHTML = '';
    Object.keys(generalStatus[document.getElementById("triggerId").value]).forEach(function(status){
      selectHTML += '<option value="' + status + '">' + getParamCoolName(status) + '</option>';
    });

    triggerParam.innerHTML = selectHTML;

  });
});

targetId.addEventListener('change', function(){
  statusRef.once('value', statusSnap => {
    var generalStatus = statusSnap.val();
    var selectHTML = '';
    Object.keys(generalStatus[document.getElementById("targetId").value]).forEach(function(status){
      selectHTML += '<option value="' + status + '">' + getParamCoolName(status) + '</option>';
    });

    targetParam.innerHTML = selectHTML;

  });
});

save.addEventListener('click', e => {
  var rule = {};
  var triggerType = document.getElementById("triggerType").value;
  console.log(triggerType);
  //Verify the trigger type
  if(triggerType == "device"){
    //Analise the value
    var value = document.getElementById("triggerValue").value;
    var num = ["0","1","2","3","4","5","6","7","8","9"];
    if (value == "true"){
      value = true;
    } else if (value == "false") {
      value = false;
    } else if (num.indexOf(value[0]) >= 0) {
      value = parseInt(value);
    }
    //Compose JSON
    rule = {
      triggers: [],
      targets: []
    }
    //Get triggers JSON
    if (document.getElementById("availableTriggers").value != "-1"){
      rule.triggers = JSON.parse(document.getElementById("availableTriggers").value);
    }
  } else if(triggerType == "time") {
    var time = document.getElementById("hour").value + ':' + document.getElementById("minute").value + ':';
    //Save week days
    var weekDays = document.getElementById("weekDays");
    for (var i = 0; i < 7; i++) {
        if(weekDays[i].selected == true){
          time += String(i);
        }
    }
    rule = {
      trigger: {
        id: "time",
        operator: "4",
        param: "time",
        value: time
      },
      targets: []
    }
  }

  //Get targets JSON
  if (document.getElementById("availableTargets").value != "-1"){
    rule.targets = JSON.parse(document.getElementById("availableTargets").value);
  }

  console.log(rule);
  //Save the data in the database
  var n = document.getElementById("n").value;
  if (getParameterByName('n')){
    rulesRef.child(n).update(rule).then(function() {
      //Make alert show up
     $('#alertContainer').html('<div class="alert alert-success fade show" role="alert" id="savedAlert"> <b>Success!</b> The rule has been saved correctly.</div>');
     $('#savedAlert').alert()
     setTimeout(function() {
        $("#savedAlert").remove();
      }, 5000);
    })
    .catch(function(error){
      html = '<div class="alert alert-danger fade show" role="alert" id="deletedAlert"> <b>Error!</b> The rule hasn\'t been saved.</div>';
      //Make alert show up
      $('#alertContainer').html(html);
      $('#deletedAlert').alert()
      setTimeout(function() {
        $("#deletedAlert").remove();
      }, 5000);
    });
  } else {
    rulesRef.child(n).update(rule).then(function() {
      window.location.href = "/cms/rules/";
    })
    .catch(function(error){
      html = '<div class="alert alert-danger fade show" role="alert" id="deletedAlert"> <b>Error!</b> The rule hasn\'t been saved.</div>';
      //Make alert show up
      $('#alertContainer').html(html);
      $('#deletedAlert').alert()
      setTimeout(function() {
        $("#deletedAlert").remove();
      }, 5000);
    });
  }

});

add_triggers_button.addEventListener('click', e => {
  //Get lasst JSON
  var availableTriggers = [];
  if (document.getElementById("availableTriggers").value != "-1"){
    availableTriggers = JSON.parse(document.getElementById("availableTriggers").value);
  }
  //Create the new toggle JSON
  var value = document.getElementById("triggerValue").value;
  var num = ["0","1","2","3","4","5","6","7","8","9"];
  if (value == "true"){
    value = true;
  } else if (value == "false") {
    value = false;
  } else if (num.indexOf(value[0]) >= 0) {
    value = parseInt(value);
  }
  var newTrigger = {
    id: document.getElementById("triggerId").value,
    param: document.getElementById("triggerParam").value,
    operator: document.getElementById("triggerOperator").value,
    value: value
  }

  availableTriggers.push(newTrigger);
  document.getElementById("availableTriggers").value = JSON.stringify(availableTriggers);
  console.log(availableTriggers);
  //Create the new HTML card
  var html = "";
  devicesRef.once('value', devicesSnap => {
    var devices = {};
    //Get a relation between id and names
    Object(devicesSnap.val()).forEach(function(device){
      devices[device.id] = device.name.nicknames[0];
    });
    var operator = ['','=','<','>','='];
    html += composeTrigger(devices[document.getElementById("triggerId").value], document.getElementById("triggerId").value, getParamCoolName(document.getElementById("triggerParam").value), operator[document.getElementById("triggerOperator").value], document.getElementById("triggerValue").value);
    document.getElementById("badge_triggers_container").innerHTML += html;
    //Clear form
    document.getElementById("triggerValue").value = "";
  });


});

add_targets_button.addEventListener('click', e => {
  //Get lasst JSON
  var availableTargets = [];
  if (document.getElementById("availableTargets").value != "-1"){
    availableTargets = JSON.parse(document.getElementById("availableTargets").value);
  }
  //Create the new toggle JSON
  var value = document.getElementById("targetValue").value;
  var num = ["0","1","2","3","4","5","6","7","8","9"];
  if (value == "true"){
    value = true;
  } else if (value == "false") {
    value = false;
  } else if (num.indexOf(value[0]) >= 0) {
    value = parseInt(value);
  }
  var newTarget = {
    id: document.getElementById("targetId").value,
    param: document.getElementById("targetParam").value,
    value: value
  }

  availableTargets.push(newTarget);
  document.getElementById("availableTargets").value = JSON.stringify(availableTargets);
  console.log(availableTargets);
  //Create the new HTML card
  var html = "";
  devicesRef.once('value', devicesSnap => {
    var devices = {};
    //Get a relation between id and names
    Object(devicesSnap.val()).forEach(function(device){
      devices[device.id] = device.name.nicknames[0];
    });
    html += composeTarget(devices[document.getElementById("targetId").value], document.getElementById("targetId").value, getParamCoolName(document.getElementById("targetParam").value), document.getElementById("targetValue").value);
    document.getElementById("badge_targets_container").innerHTML += html;
    //Clear form
    document.getElementById("targetValue").value = "";
  });


});

deleteDevice.addEventListener('click', e => {

  if (confirm("Do you want to delete the device?")){
    var n = document.getElementById("n").value;
    var html = "";
    rulesRef.child(n).remove()
      .then(function() {
        html = '<div class="alert alert-warning fade show" role="alert" id="deletedAlert"> <b>Success!</b> The rule has been deleted correctly.</div>';
        //Make alert show up
        $('#alertContainer').html(html);
        $('#deletedAlert').alert()
        setTimeout(function() {
            $("#deletedAlert").remove();
        }, 5000);
      })
      .catch(function(error){
        html = '<div class="alert alert-danger fade show" role="alert" id="deletedAlert"> <b>Error!</b> The rule hasn\'t been deleted.</div>';
        //Make alert show up
        $('#alertContainer').html(html);
        $('#deletedAlert').alert()
        setTimeout(function() {
          $("#deletedAlert").remove();
        }, 5000);
      });

    window.location.href = "/cms/rules/";
  } else {
    //Make alert show up
     $('#alertContainer').html('<div class="alert alert-success fade show" role="alert" id="savedAlert"> <b>OK</b> The rule hasn\'t been deleted. Be careful!</div>');
     $('#savedAlert').alert()
     setTimeout(function() {
        $("#savedAlert").remove();
      }, 5000);
  }


});

function changeTriggerType(type){
  document.getElementById('triggerType').value = type;
  document.getElementById('target').style.visibility = "visible";
  document.getElementById('deviceTriggeredButton').style.visibility = "hidden";
  document.getElementById('deviceTriggeredButton').style.width = "0px";
  document.getElementById('timeTriggeredButton').style.visibility = "hidden";
  document.getElementById('timeTriggeredButton').style.width = "0px";
}

////////////////////////////////////////
//Triggers & targets Magic
////////////////////////////////////////

function deleteTrigger(id, param){
  var availableTriggers = JSON.parse(document.getElementById("availableTriggers").value);
  var newTriggers = []

  document.getElementById('trigger_' + id + '_' + param).remove();

  Object(availableTriggers).forEach(function(trigger){
    if (trigger.id != id && trigger.param != param){
      newTriggers.push(trigger);
    }
  });

  document.getElementById("availableTriggers").value = JSON.stringify(newTriggers);
}

function composeTrigger(name, id, param, operator, value){
  var html = "";
  html += '<div class="col-sm-6" style="margin-top: 10px;" id="trigger_' + id + '_' + param + '">';
    html += '<div class="card">';
      html += '<div class="card-body">';
        html += '<h5 class="card-title">' + name + '</h5>';
        html += '<p>' + param + ' ' + operator + ' ' + value + '</p>';
        html += '<button type="button" class="btn btn-danger" onclick="deleteTrigger(\'' + id + '\',\'' + param + '\')">Delete</button>';
      html += '</div>';
    html += '</div>';
  html += '</div>';

  return html;
}

function deleteTarget(id, param){
  var availableTargets = JSON.parse(document.getElementById("availableTargets").value);
  var newTargets = []

  document.getElementById('target_' + id + '_' + param).remove();

  Object(availableTargets).forEach(function(target){
    if (target.id != id && target.param != param){
      newTargets.push(target);
    }
  });

  document.getElementById("availableTargets").value = JSON.stringify(newTargets);
}

function composeTarget(name, id, param, value){
  var html = "";
  html += '<div class="col-sm-6" style="margin-top: 10px;" id="target_' + id + '_' + param + '">';
    html += '<div class="card">';
      html += '<div class="card-body">';
        html += '<h5 class="card-title">' + name + '</h5>';
        html += '<p>' + param + ' = ' + value + '</p>';
        html += '<button type="button" class="btn btn-danger" onclick="deleteTarget(\'' + id + '\',\'' + param + '\')">Delete</button>';
      html += '</div>';
    html += '</div>';
  html += '</div>';

  return html;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
