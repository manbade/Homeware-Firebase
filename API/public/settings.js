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
var settingsRef = firebase.database().ref().child('settings');

//Read the autoAuthentication status
autoAuthentication.addEventListener('change', function() {
  //Update the text message
  document.getElementById('textMessageAlert').innerHTML = '...';
  var status = document.getElementById('autoAuthentication').checked;
  settingsRef.update({autoAuthentication: status})
    .then(function(){
      //update the text message
      document.getElementById('textMessageAlert').innerHTML = 'Saved';
    })
    .catch(function(error){
      //update the text message and log the error
      document.getElementById('textMessageAlert').innerHTML = 'An error has happed.';
      console.log(error);
    });
});

//Load values
settingsRef.once('value')
  .then(function(dataSnapshot){
    var settings = dataSnapshot.val();
    Object.keys(settings).forEach(function(setting){
      document.getElementById(setting).checked = settings[setting];
    });
  })


function updateModal(settings){
  var title = 'Fail';
  var paragrahp = 'Something goes wrong';

  if (settings == 'autoAuthentication'){
    title = 'Automatic authentication';
    paragraph = 'If <b>False</b> manual authentication must be done from the <i>Device</i> section:<br>  <ul><li>For new devices</li> <li>If the device lost its refresh token</li></ul> If <b>True</b> the devices will autoconnect using its <i>Authorization code</i>.';
  } else if (settings == 'authorizationCodeStructure'){
    title = 'Authorization code structure';
    paragraph = 'This is the structure that the API will use to auto generate authorization codes.';
  }


  document.getElementById('learMoreModalTitle').innerHTML = title;
  document.getElementById('learMoreModalParagraph').innerHTML = paragraph;

}
