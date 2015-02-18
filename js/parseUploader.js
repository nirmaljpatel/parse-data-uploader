var https = require('https');

var _ = require('underscore');



/*
var globalTunnel = require('global-tunnel');


globalTunnel.initialize({
host: 'localhost',
port: 3128,
sockets: 50 // optional pool size for each http and https
});
 */
var scheduleJson = require("../data/schedule.json");
var squadJson = require("../data/squad.json");

var wc = {
    tournamentId : scheduleJson.tournamentId.id,
    tournamentName : scheduleJson.tournamentId.name,
    schedule : scheduleJson.schedule,
    squad : squadJson.squads
};

var addToParse = function (dataObj) {
    var post_data = JSON.stringify(dataObj);
    var post_options = {
        hostname : 'api.parse.com',
        port : 443,
        path : '/1/classes/'+this.className,
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
        }.bind(this));
        res.on('end', function () {
            var jsonRes = JSON.parse(this.str);
            this.obj.objectId = jsonRes.objectId;
            console.log("after:", this.obj);
        }.bind(this));
        });

    // post the data
    post_req.write(post_data);
    post_req.end();
};

var seasonObj = {
    icc_id : wc.tournamentId,
    name : wc.tournamentName
};
this.className = 'Season';
[seasonObj].forEach(addToParse, this);

var totalMatches = wc.schedule.length;
var venues = [];
var teams = [];
var matches = [];

for(var i=0; i < totalMatches; i++) {
        var match = wc.schedule[i];
        console.log("["+i+"]: ", match);
    
        var matchData = {
                matchId:match.matchId.id,
                matchName: match.matchId.name,
                matchType: match.matchType,
                description: match.description,
                venueId: match.venue.id,
                matchDate: match.matchDate,
                groupName: match.groupName,
                team1: match.team1?match.team1.team.id:null,
                team2: match.team2?match.team2.team.id:null,
                matchState: match.matchState
        };
        if (_.findWhere(matches, matchData) == null) {
            matches.push(matchData);
        }
    
        var venue = match.venue;
        var venueData = {
                venueId: venue.id,
                country: venue.country,
                fullName: venue.fullName,
                shortName: venue.shortName,
                city: venue.city
        };
        if (_.findWhere(venues, venueData) == null) {
            venues.push(venueData);
        }
        if(match.team1 !== undefined) {
            var team = match.team1.team;
            var teamData = {
                type: team.type,
                fullName: team.fullName,
                shortName: team.shortName,
                abbrv: team.abbreviation,
                primaryColor: team.primaryColor,
                secondaryColor: team.secondaryColor,
                teamId: team.id
            };
            if (_.findWhere(teams, teamData) == null) {
                teams.push(teamData);
            }
            team = match.team2.team;
            teamData = {
                type: team.type,
                fullName: team.fullName,
                shortName: team.shortName,
                abbrv: team.abbreviation,
                primaryColor: team.primaryColor,
                secondaryColor: team.secondaryColor,
                teamId: team.id
            };
            if (_.findWhere(teams, teamData) == null) {
                teams.push(teamData);
            }
        }
}

this.className = 'Venue';
venues.forEach(addToParse, this);

console.log(venues);