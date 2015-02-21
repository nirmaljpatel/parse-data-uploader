var Promise = require('promise');
var https = require('https');

var config = require('./config.json');
var post_options = {
			hostname : 'api.parse.com',
			port : 443,
			headers : {
				'X-Parse-Application-Id' : config.parseAppId,
				'X-Parse-REST-API-Key' : config.parseRestKey,
				'Content-Type' : 'application/json',
			}
		};

exports.add = function(dataObj) {
	return new Promise(function (resolve, reject) {
		//console.log("Inside Promise:", this.className);
		var post_data = JSON.stringify(dataObj);
		
		post_options.method = 'POST';
		post_options.path = '/1/classes/' + this.className;
		
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
					console.log(err);
					reject(err);
				});
			});

		// post the data
		post_req.write(post_data);
		post_req.end();
	});
};
exports.update = function(dataObj){
	return new Promise(function (resolve, reject) {
		//console.log("Inside Promise:", this.className);
		var post_data = JSON.stringify(dataObj);
		
		post_options.method = 'PUT';
		post_options.path = '/1/classes/' + this.className + '/' + dataObj.objectId;
		
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
				this.obj.updatedAt = jsonRes.updatedAt;
				console.log("After updateToParse:", this.obj);
				resolve(this.obj);
			}
			.bind(this));
			res.on('error', function (err) {
				console.log(err);				
				reject(err);
			});
		});
		
		// post the data
		post_req.write(post_data);
		post_req.end();
	});
};