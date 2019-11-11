(function () {

  var actual = 'v0.6.2';
  document.getElementById('HomeWareStatus').innerHTML += '<p> <b>Current version:</b> ' + actual + ' </p>';

  firebase.initializeApp(config);

  firebase.auth().onAuthStateChanged(firebaseUser => {
    if (firebaseUser){
      console.log('Logged in');
    } else {
      console.log('Not logged in');
      window.location.href = "/cms/login/";
    }
  });

  var latest = new XMLHttpRequest();
  latest.addEventListener('load', showLatest);
  latest.open('GET', 'https://api.github.com/repos/kikeelectronico/Homeware/releases/latest');
  latest.send();

  function showLatest(){
    var latestRelease = JSON.parse(this.responseText);
    console.log(latestRelease);
    if (actual != latestRelease.tag_name){
      document.getElementById('HomeWareStatus').innerHTML += '<p style="background-color:#81F79F; padding:20px;"> <b>New versión available:</b> ' + latestRelease.tag_name + ' <br> <b>Description:</b> ' + latestRelease.body + ' <br> <b>Download</b> it from <a href="https://github.com/kikeelectronico/Homeware/releases/tag/v0.6.1" target="blanck">here</a> </p> ';
    } else {
      document.getElementById('HomeWareStatus').innerHTML += 'Your system is up to date';
    }
  }


}());
