(function () {

  var ajax = new XMLHttpRequest();
  ajax.open("GET", "/navbar/", false);
  ajax.send();
  document.getElementById('navbarBlock').innerHTML += ajax.responseText;

  var ajax = new XMLHttpRequest();
  ajax.open("GET", "/head/", false);
  ajax.send();
  document.head.innerHTML += ajax.responseText;

}());
