var _ = require('underscore');
var Promise = require('promise');

var parseUtils = require('./parseUtils.js');
//To tunnel via CNTLM
/*
var globalTunnel = require('global-tunnel');
globalTunnel.initialize({
	host : 'localhost',
	port : 3128,
	sockets : 50 // optional pool size for each http and https
});
*/

//Easiest way to read in JSON files
var scheduleJson = require("../data/schedule.json");
var squadJson = require("../data/squad.json");

var wc = {
	tournamentId : scheduleJson.tournamentId.id,
	tournamentName : scheduleJson.tournamentId.name,
	schedule : scheduleJson.schedule,
	squad : squadJson.squads
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

var addParseRelationPointer = function (ptrToClassName, arrToObjIds) {
	var relation = {
		"__op" : "AddRelation",
		"objects" : []
	};

	var totalIds = arrToObjIds.length;
	for (var i = 0; i < totalIds; i++) {
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
	var venueObjId = (_.findWhere(venues, {
			venueId : match.venueId
		})).objectId;
	match.venue = addParseRelationPointer("Venues", [venueObjId]);
	
	var seasonObjId = seasonObj.objectId;
	match.season = addParseRelationPointer("Seasons", [seasonObjId]);
	

	if (match.team1) {
		var team1ObjId = (_.findWhere(teams, {
				teamId : match.team1
			})).objectId;
		var team2ObjId = (_.findWhere(teams, {
				teamId : match.team2
			})).objectId;

		match.teams = addParseRelationPointer("Teams", [team1ObjId, team2ObjId]);
	}
	//console.log("After addRelations: ", match);
}

var getObjId = function(obj){
		return obj.objectId?obj.objectId:null;
};

Promise.all(function (seasonObj) {
	console.log("Adding Seasons");
	this.className = 'Seasons';
	return ([seasonObj].map(parseUtils.add, this));
}(seasonObj))
.then(function (seasons) {
	console.log("...Then... updated Seasons:", seasons);
}).then(function () {
	console.log("Then... adding Venues");
	this.className = 'Venues';
	return Promise.all(
		venues.map(parseUtils.add, this));
}).then(function (venues) {
	console.log("...Then... updated Venues:", venues);
}).then(function () {
	console.log("Then... adding Teams");
	this.className = 'Teams';
	return Promise.all(
		teams.map(parseUtils.add, this));
}).then(function (teams) {
	console.log("...Then... updated Teams:", teams);
}).then(function () {
	console.log("Then... Updating Matches with relations");
	matches.forEach(addRelationsToMatch);
	console.log("...Then adding Matches");
	this.className = 'Matches';
	return Promise.all(
		matches.map(parseUtils.add, this));
}).then(function () {
	console.log("...Then... updated Matches:", matches);
}).then(function(){
		matchObjIds = matches.map(getObjId);
		console.log("...Then... match ObjIds:",matchObjIds);
		seasonObj.matches = addParseRelationPointer("Matches", matchObjIds);
		this.className = 'Seasons';
		[seasonObj].map(parseUtils.update, this);
}).catch (function (err) {
	console.log("Error occurred...", err);
})
	.then(function () {
		console.log("Then... The End.");
	});
