

firebase.initializeApp(config);

firebase.database().ref('paramLog').child(getParameterByName('id')).on('value', deviceSnapshot => {
  var device = deviceSnapshot.val();
  var colors = ['rgba(255, 0, 0, 0.2)','rgba(0, 255, 0, 0.2)'];
  var colorsBorder = ['rgba(255, 0, 0, 1)','rgba(0, 255, 0, 1)'];
  var i = 0;
  if (device === null){
    document.getElementById('chartContainer').innerHTML = 'There is no data';
  } else {
    //Get the labels
    var labels = [];

      //Compose datasheet
      var datasets = [];
      Object.keys(device).forEach(function(paramKey){
        var log = device[paramKey];
        //Compose the datasheet
        var localDatasheet = {
            label: '',
            data: [],
            backgroundColor: [colors[i]],
            borderColor: [colorsBorder[i]],
            borderWidth: 1
        }
        i++;
        //Compose data points
        Object.keys(log).forEach(function(logKey){
          var register = log[logKey];
          localDatasheet.label = getParamCoolName(register.param);
          labels.push(formatDate(register.timestamp));
          localDatasheet.data.push(register.value);

        });
        datasets.push(localDatasheet);
      });

    //Set the chart
    document.getElementById('chartContainer').innerHTML = '<canvas id="myChart" width="400" height="100"></canvas>';
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
  }//IF end

})

function formatDate(timestamp){
  var date = new Date(timestamp);
  var year    = date.getFullYear();
  var month   = date.getMonth()+1;
  var day     = date.getDate();
  var hour    = date.getHours();
  var minute  = date.getMinutes();
  return day + '/' + month + '/' + year + ' ' + hour + ':' + minute
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
