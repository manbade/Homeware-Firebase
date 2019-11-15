var ajaxNavbar = new XMLHttpRequest();
ajaxNavbar.addEventListener("load", loadNavbar);
ajaxNavbar.open("GET", "/navbar/");
ajaxNavbar.send();

var ajaxHead = new XMLHttpRequest();
ajaxHead.addEventListener("load", loadHead);
ajaxHead.open("GET", "/head/");
ajaxHead.send();

function loadNavbar(){
  document.getElementById('navbarBlock').innerHTML += this.responseText;
  logout.addEventListener('click', e =>{
    firebase.auth().signOut();
  });
}

function loadHead(){
  document.head.innerHTML += this.responseText;
}
