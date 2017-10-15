var querystring = require('querystring');
var https = require('https');

var AML_MODEL_FLIGHTS_URL = process.env.AML_MODEL_FLIGHTS_URL,
    AML_MODEL_FLIGHTS_KEY = process.env.AML_MODEL_FLIGHTS_URL;

var data = {
        "Inputs": {
                "input1":
                [
                    {
                            'Month': "1",   
                            'DayofMonth': "1",   
                            'DayOfWeek': "1",   
                            'Carrier': "DL",   
                            'OriginAirportID': "14869",   
                            'DestAirportID': "12478",   
                            'DepDelay': "10"
                    }
                ],
        },
    "GlobalParameters":  {
    }
}

module.exports = {
    executeCall: function (path, callback) {
        var options = {
            host: 'ussouthcentral.services.azureml.net',
            port: 443,
            path: '/workspaces/1736e6c051984cd588741009363fa157/services/f4387fe28a504b77977608869570c358/execute?api-version=2.0&format=swagger',
            method: 'GET',
            headers = {'Content-Type':'application/json', 'Authorization':('Bearer '+ AML_MODEL_FLIGHTS_KEY)}
        };
        
        options.headers['Content-Length'] = data.length; 
     
        var request = https.request(options, function (response) {
            response.setEncoding('utf8');
            response.on('data', function (chunk) { data += chunk; });
            response.on('end', function () {
                callback(JSON.parse(data));
            });
        });
        
        request.on('error', function(e) {
            console.log('Problem with request: ' + e.message);
        });
        
        request.write(data);
        request.end();
    }
}