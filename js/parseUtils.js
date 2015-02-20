var Promise = require('promise');
var https = require('https');

var post_options = {
			hostname : 'api.parse.com',
			port : 443,
			headers : {
				'X-Parse-Application-Id' : 'chawe9LzqdIrsoo20Yz092PUwsw8Ce73lEh4mP9d',
				'X-Parse-REST-API-Key' : 'jTqEWDOcz8OXrIF2YkxltyagFYSLBHdXu3MRa77k',
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
				reject(err);
			});
		});
		
		// post the data
		post_req.write(post_data);
		post_req.end();
	});
};