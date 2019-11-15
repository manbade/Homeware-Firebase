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
var database = firebase.database();

//Auto save the autoAuthentication status
autoAuthentication.addEventListener('change', function() {
  //Update the text message
  document.getElementById('textMessageAlert').innerHTML = '...';
  //Get the status switch
  var status = document.getElementById('autoAuthentication').checked;
  //Save the status
  database.ref('/settings/bools/').update({autoAuthentication: status})
    .then(function(){
      //Get the settings
      return database.ref('/settings/strings/').once('value');
    })
    .then(function(settingsSnapshot){
      //Change the authorization code at the database
      codeKey = settingsSnapshot.val().codeKey;
      return database.ref('/token/').once('value');
    })
    .then(function(tokenSnapshot){
      var ids = Object.keys(tokenSnapshot.val());
      ids.forEach(function(id){
        if(id != 'google'){
          if (status) {
            authorizationCode = id + codeKey;
          } else {
            //Generate a random value
            authorizationCode = Math.random()*1000;
            //authorizationCode = '-';
          }
          database.ref('/token/').child(id).child('authorization_code').update({ value: authorizationCode});
        }
      });

      //Update the text message
      updateMessageWithTime();
    })
    .catch(function(error){
      //update the text message and log the error
      document.getElementById('textMessageAlert').innerHTML = 'An error has happed.';
      console.log(error);
    });
});

//Manual save
save.addEventListener('click', function() {
  //Update the text message
  document.getElementById('textMessageAlert').innerHTML = '...';
  //Save the data
  database.ref('/settings/strings/').update({
    codeKey: document.getElementById('codeKey').value
  })
  //Update the text message
  updateMessageWithTime();
});

//Load bools values
database.ref('/settings/bools/').once('value')
  .then(function(dataSnapshot){
    var settings = dataSnapshot.val();
    Object.keys(settings).forEach(function(setting){
      document.getElementById(setting).checked = settings[setting];
    });
  })

//load string values
database.ref('/settings/strings/').once('value')
  .then(function(dataSnapshot){
    var settings = dataSnapshot.val();
    Object.keys(settings).forEach(function(setting){
      document.getElementById(setting).value = settings[setting];
    });
  })

//Load the events
showEventsLog.addEventListener('click', function(){
  database.ref('/events/read/').on('value', function(eventsSnapshot){
    var events = eventsSnapshot.val();
    var eventsKeys = Object.keys(events);
    //Compose the HTML
    var html = '';
    for(i = eventsKeys.length-1; i > eventsKeys.length-11; i--){
      var uniqueEvent = events[eventsKeys[i]];
      date = new Date(uniqueEvent.timestamp);
      html += '<div class="card"> <div class="card-body">';
      html += '<b>' + uniqueEvent.title + '</b> <br> ' + uniqueEvent.text + ' <br> <b>Timestamp</b>: ';
      html += addZero(date.getDate()) + '/' + addZero(date.getMonth()) + '/' + date.getFullYear() + ' ' + addZero(date.getHours()) + ':' + addZero(date.getMinutes()) + ':' + addZero(date.getSeconds());
      html += '</div> </div>';
    }

    document.getElementById('eventsLogBox').innerHTML = html;
  })
})

function updateModal(settings){
  var title = 'Fail';
  var paragrahp = 'Something goes wrong';

  if (settings == 'autoAuthentication'){
    title = 'Automatic authentication';
    paragraph = 'If <b>False</b> manual authentication must be done from the <i>Device</i> section:<br>  <ul><li>For new devices</li> <li>If the device lost its refresh token</li></ul> If <b>True</b> the devices will autoconnect using its <i>Authorization code</i>.';
  } else if (settings == 'codeKey'){
    title = 'Key for authorization code';
    paragraph = 'The authorization code is compose with the device\'s id and the Key for authorization code. <br><br> For example, if the device\'s id is <b><i>"bedroom-light"</i></b> and the key is <b><i>"-code"</i></b> the athorization code will be <b><i>"bedroom-light-code"</i></b>.';
  }


  document.getElementById('learMoreModalTitle').innerHTML = title;
  document.getElementById('learMoreModalParagraph').innerHTML = paragraph;

}

//Print message after save
function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function updateMessageWithTime(){
  var d = new Date();
  var h = addZero(d.getHours());
  var m = addZero(d.getMinutes());
  var s = addZero(d.getSeconds());
  document.getElementById('textMessageAlert').innerHTML = 'Saved at ' + h + ":" + m + ":" + s;
}
