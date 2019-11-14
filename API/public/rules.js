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
      Object(rules).forEach(function(rule){
        var operator = [' ', '=', '<', '>'];
        //Rules
        rulesHTML += '<div class="card" style="width: 18rem; margin: 20px;"> \
                      <div class="card-header">'
        rulesHTML +=   devices[rule.trigger.id]  + '<br>  (' + rule.trigger.param + ' ' + operator[rule.trigger.operator] + ' ' + rule.trigger.value + ')';
        rulesHTML += '</div> \
                      <ul class="list-group list-group-flush">';
                      Object(rule.targets).forEach(function(target){
                        rulesHTML += '<li class="list-group-item" style="margin-left:30px">' + devices[target.id]  + '<br>  (' + target.param + ' = ' + target.value + ')</li>';
                      });
        rulesHTML +=  '<div class="col" style="vertical-align:top; text-align:right;margin: 10px;"><a href="/cms/rules/edit/?n=' + n + '" class="btn btn-primary">Edit</a></div> \
                      </ul> \
                    </div>';
        n += 1;
      });
      rulesList.innerHTML = rulesHTML;
    });
  });

}());
