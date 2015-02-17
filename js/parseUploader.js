var http = require('http');

var globalTunnel = require('global-tunnel');
 
globalTunnel.initialize({
  host: 'localhost',
  port: 3128,
  sockets: 50 // optional pool size for each http and https 
});

var scheduleJson = require("../data/schedule.json");
var squadJson = require("../data/squad.json");

var wc = {
	tournamentId: scheduleJson.tournamentId.id,
	tournamentName: scheduleJson.tournamentId.name,
	schedule: scheduleJson.schedule,
	squad: squadJson.squads
};


var dataObj = {
		key: wc.tournamentId,
		name: wc.tournamentName
	};
var post_data = JSON.stringify(dataObj);

var post_options = {
	host : 'https://api.parse.com',
	path : '/1/classes/Season',
	method : 'POST',
	headers : {
		'X-Parse-Application-Id' : 'chawe9LzqdIrsoo20Yz092PUwsw8Ce73lEh4mP9d',
		'X-Parse-REST-API-Key' : 'jTqEWDOcz8OXrIF2YkxltyagFYSLBHdXu3MRa77k',
		'Content-Type' : 'application/json',
		'Content-Length': Buffer.byteLength(post_data),
	}
};

// Set up the request
var post_req = http.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('Response: ' + chunk);
		});
	});

// post the data
post_req.write(post_data);
post_req.end();