(function () {

  firebase.initializeApp(config);

  firebase.auth().onAuthStateChanged(firebaseUser => {
    if (firebaseUser){
      console.log('Logged in');
    } else {
      console.log('Not logged in');
      window.location.href = "/cms/login/";
    }
  });

  // Get a status to the database service
  var database = firebase.database();
  var statusRef = database.ref().child('status');
  var devicesRef = database.ref().child('devices');
  var rulesRef = database.ref().child('rules');

  rulesRef.on('value', rules_snap => {
    var rules = rules_snap.val();
    devicesRef.once('value', devices_snap => {
      var devices = {};
      //Get a relation between id and names
      Object(devices_snap.val()).forEach(function(device){
        devices[device.id] = device.name.nicknames[0];
      });

      var rulesHTML = '';
      var n = 0;
      var rulesKeys = Object.keys(rules);
      Object(rules).forEach(function(rule){
        //Detect the kind of triger (simple or multiple)
        var ruleKeys = Object.keys(rule);
        var amountRules = 1;
        var verified = 0;
        var triggers = [];
        if (ruleKeys.includes("triggers")){
          amountRules = Object.keys(rule.triggers).length;
          triggers = rule.triggers;
        } else {
          triggers.push(rule.trigger);
        }

        var operator = [' ', '=', '<', '>'];
        //Rules
        rulesHTML += '<div class="card cardRule" style="margin-top: 15px;"> \
                      <div class="card-header">'
        var newLine = false;
        triggers.forEach(function(trigger){
          rulesHTML += newLine ? '<hr>' : '';
          //Device or time triggered
          if(devices[trigger.id]){
            rulesHTML += '<b>' + devices[trigger.id] + '</b>(' + getParamCoolName(trigger.param) + ') ' + operator[trigger.operator] + ' ';
            //Device to device or device to constant
            if (String(trigger.value).includes('>')){
              var secondaryDevice = trigger.value.split('>');
              rulesHTML += '<b>' + devices[secondaryDevice[0]] + '</b>(' + getParamCoolName(secondaryDevice[1]) + ')';
            } else {
              rulesHTML += trigger.value;
            }
          } else {
            rulesHTML += '<b>Time</b> <br>';
            var time = trigger.value.split(':');
            rulesHTML += putZero(time[0]) + ':' + putZero(time[1]) + '    ';
            //Week days
            var weekDays = time.length == 3 ? time[2] : '';
            var week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for(var i = 0; i < 7; i++){
              if (weekDays.includes(i))
                rulesHTML += week[i] + ' ';
            }
          }
          newLine = true;
        });

        rulesHTML += '</div> \
                      <ul class="list-group list-group-flush">';
                      Object(rule.targets).forEach(function(target){
                        rulesHTML += '<li class="list-group-item" style="margin-left:30px"><b>' + devices[target.id]  + '</b>(' + getParamCoolName(target.param) + ') = ' + target.value + '</li>';
                      });
        rulesHTML +=  '<div class="col" style="vertical-align:top; text-align:right;margin: 10px;"><a href="/cms/rules/edit/?n=' + rulesKeys[n] + '" class="btn btn-primary">Edit</a></div> \
                      </ul> \
                    </div>';
        n += 1;
      });
      rulesList.innerHTML = rulesHTML;
    });
  });

}());
