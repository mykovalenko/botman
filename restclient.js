var querystring = require('querystring');
var https = require('https');

var AML_MODEL_FLIGHTS_URL = process.env.AML_MODEL_FLIGHTS_URL,
    AML_MODEL_FLIGHTS_KEY = process.env.AML_MODEL_FLIGHTS_KEY;

var post_data = JSON.stringify({
    "Inputs": {
        "input1": [
            {
                "Year": "1",   
                "Month": "1",
                "DayofMonth": "1",
                "DayOfWeek": "1",
                "Carrier": "DL",
                "OriginAirportID": "14869",
                "DestAirportID": "12478",
                "CRSDepTime": "1",   
                "DepDelay": "10",
                "DepDel15": "0",   
                "CRSArrTime": "0",   
                "ArrDelay": "0",   
                "ArrDel15": "0",   
                "Cancelled": "0"
            }
        ]
    },
    "GlobalParameters": {
    }
});

module.exports = {
    executeCall: function (path, callback) {
        var options = {
            host: 'ussouthcentral.services.azureml.net',
            port: 443,
            path: '/workspaces/1736e6c051984cd588741009363fa157/services/f4387fe28a504b77977608869570c358/execute?api-version=2.0&format=swagger',
            method: 'POST',
            headers: {
                'User-Agent': 'botman',
                'Content-Type':'application/json',
                'Content-Length': Buffer.byteLength(post_data),
                'Authorization':'Bearer '+AML_MODEL_FLIGHTS_KEY
            }
        };
        
        var request = https.request(options, function (response) {
            var data = "";
            response.setEncoding('utf8');
            response.on('data', function (chunk) { data += chunk; });
            response.on('end', function () {
                callback(JSON.parse(data));
            });
        });
        
        request.on('error', function(e) {
            console.log('Problem with request: ' + e.message);
        });
        
        request.write(post_data);
        request.end();
    }
}