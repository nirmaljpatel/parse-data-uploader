var https = require('https');
var _ = require('underscore');

var Promise = require('promise');

//To tunnel via CNTLM
var globalTunnel = require('global-tunnel');
globalTunnel.initialize({
	host : 'localhost',
	port : 3128,
	sockets : 50 // optional pool size for each http and https
});

//Easiest way to read in JSON files
var scheduleJson = require("../data/schedule.json");
var squadJson = require("../data/squad.json");

var wc = {
	tournamentId : scheduleJson.tournamentId.id,
	tournamentName : scheduleJson.tournamentId.name,
	schedule : scheduleJson.schedule,
	squad : squadJson.squads
};

function addToParse(dataObj) {
	return new Promise(function (resolve, reject) {
		//console.log("Inside Promise:", this.className);
		var post_data = JSON.stringify(dataObj);
		var post_options = {
			hostname : 'api.parse.com',
			port : 443,
			path : '/1/classes/' + this.className,
			method : 'POST',
			headers : {
				'X-Parse-Application-Id' : 'chawe9LzqdIrsoo20Yz092PUwsw8Ce73lEh4mP9d',
				'X-Parse-REST-API-Key' : 'jTqEWDOcz8OXrIF2YkxltyagFYSLBHdXu3MRa77k',
				'Content-Type' : 'application/json',
				'Content-Length' : Buffer.byteLength(post_data),
			}
		};

		// Set up the request
		var post_req = https.request(post_options, function (res) {
				this.obj = dataObj;
				this.str = '';
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					this.str += chunk;
				}
					.bind(this));
				res.on('end', function () {
					var jsonRes = JSON.parse(this.str);
					this.obj.objectId = jsonRes.objectId;
					console.log("After addToParse:", this.obj);
					resolve(this.obj);
				}
					.bind(this));
				res.on('error', function (err) {
					reject(err);
				});
			});

		// post the data
		post_req.write(post_data);
		post_req.end();
	});
};

var seasonObj = {
	icc_id : wc.tournamentId,
	name : wc.tournamentName
};

var totalMatches = wc.schedule.length;
var venues = [];
var teams = [];
var matches = [];

for (var i = 0; i < totalMatches; i++) {
	var match = wc.schedule[i];
	//console.log("["+i+"]: ", match);

	var matchData = {
		matchId : match.matchId.id,
		matchName : match.matchId.name,
		matchType : match.matchType,
		description : match.description,
		venueId : match.venue.id,
		matchDate : match.matchDate,
		groupName : match.groupName,
		team1 : match.team1 ? match.team1.team.id : null,
		team2 : match.team2 ? match.team2.team.id : null,
		matchState : match.matchState,
		matchStatus : match.matchState !== "U" ? match.matchStatus : null,
		reportLink : match.matchState !== "U" ? match.reportLink : null
	};
	if (_.findWhere(matches, matchData) == null) {
		matches.push(matchData);
	}

	var venue = match.venue;
	var venueData = {
		venueId : venue.id,
		country : venue.country,
		fullName : venue.fullName,
		shortName : venue.shortName,
		city : venue.city
	};
	if (_.findWhere(venues, venueData) == null) {
		venues.push(venueData);
	}
	if (match.team1 !== undefined) {
		var team = match.team1.team;
		var teamData = {
			type : team.type,
			fullName : team.fullName,
			shortName : team.shortName,
			abbrv : team.abbreviation,
			primaryColor : team.primaryColor,
			secondaryColor : team.secondaryColor,
			teamId : team.id
		};
		if (_.findWhere(teams, teamData) == null) {
			teams.push(teamData);
		}
		team = match.team2.team;
		teamData = {
			type : team.type,
			fullName : team.fullName,
			shortName : team.shortName,
			abbrv : team.abbreviation,
			primaryColor : team.primaryColor,
			secondaryColor : team.secondaryColor,
			teamId : team.id
		};
		if (_.findWhere(teams, teamData) == null) {
			teams.push(teamData);
		}
	}
}

var addParseRelationPointer = function(ptrToClassName, arrToObjIds){
	var relation =  {
		"__op" : "AddRelation",
		"objects" : []
	};
	
	var totalIds = arrToObjIds.length;
	for (var i=0; i<= totalIds; i++){
		var ptr = {
			"__type" : "Pointer",
			"className" : ptrToClassName,
			"objectId" : arrToObjIds[i]
		};	
		relation.objects.push(ptr);
	}
	return relation;
};

var addRelationsToMatch = function (match) {
	var venueObjId = (_.findWhere(venues, {venueId: match.venueId})).objectId
	match.venue = addParseRelationPointer("Venues", [venueObjId]) ;
	
	if(match.team1) {
		var team1ObjId = (_.findWhere(teams, {teamId: match.team1})).objectId;
		var team2ObjId = (_.findWhere(teams, {teamId: match.team2})).objectId;
		
		match.teams = addParseRelationPointer("Teams", [team1ObjId, team2ObjId]);
	}
	//console.log("After addRelations: ", match);
}

Promise.all(function (seasonObj) {
	this.className = 'Seasons';
	return ([seasonObj].map(addToParse, this));
}
	(seasonObj)).then(function (seasons) {
	console.log("Then... updated Seasons:", seasons);
}).then(function () {
	console.log("Then... adding Venues");
	this.className = 'Venues';
	return Promise.all(
		venues.map(addToParse, this));
}).then(function (venues) {
	console.log("Then... updated Venues:", venues);
}).then(function () {
	this.className = 'Teams';
	return Promise.all(
		teams.map(addToParse, this));
}).then(function (teams) {
	console.log("Then... updated Teams:", teams);
}).then(function () {
	matches.forEach(addRelationsToMatch);
	this.className = 'Matches';
	return Promise.all(
		matches.map(addToParse, this));
}).then(function(){
	console.log("Then... updated Matches:", matches);
}).catch (function (err) {
	console.log("Error occurred...", err);
})
	.then(function () {
		console.log("Then... The End.");
	});
