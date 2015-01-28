#!/usr/bin/env nod

var sonosWeatherModule = sonosWeatherModule || {};

(function(){
	var http = require('http');
	var util = require('util');
	var sonos = require('./node_modules/sonos/lib/sonos');
	
	var SONOS_HOST_HUB = '10.0.1.150';
	var SONOS_HOST_BAR = '10.0.1.200';
	var WEATHER_API_ID = process.env.SONOS_WEATHER_API_ID;
	
	var TEXT_TO_SPEACH = 'Salut.' + getDateTime() + 'Dehors il fait %s° et %s';

	var INFO = true;
	var DEBUG = true;
	
	function Core() {
	};

	function getWeather(_callback) {
		var options = { 
			host: 'api.openweathermap.org',
			path: '/data/2.5/weather?appid=' + WEATHER_API_ID + '&id=2973783&lang=fr&units=metric',
			agent: false
		};  

		httpGet('getWeather', options, function (res){
			_callback(res);
		})  
	}

	function httpGet(_name, _options, _callback) {
		http.get(_options, function(res) { 
			if (INFO) {
				console.log('httpGet: ' + _name);
			}
			
			res.on('data', function(){
				// if not here, can't bind on 'end'
			}); 
			
			_callback(res);
			
			if (DEBUG) {
				console.log(res);
			}
		}).on('error', function(e) {
			_callback(null);
			console.log(e);
		});
	}

	function getDateTime() {
		var dateNow = new Date();
		var hour = dateNow.getHours();
		hour = (hour < 10 ? "0" : "") + hour;
		var min  = dateNow.getMinutes();
		min = (min < 10 ? "0" : "") + min;
		var year = dateNow.getFullYear();
		var months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
		var month = months[dateNow.getMonth()];
		var days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
		var day = days[dateNow.getDay()];
		var date = dateNow.getDate();
	
		return 'Nous sommes le ' + day + ' ' + date + ' ' + month + '.Il est ' + hour + ':' + min + '.';
	}

	function tryDownloadTTS(phrase, language, callback) {
		// Use Google tts translation service to create a mp3 file
		var tts_request = 'http://translate.google.com/translate_tts?ie=UTF-8&q=' + phrase + '&tl=' + language;

		// Construct a filesystem neutral filename
		var filename = crypto.createHash('sha1').update(phrase).digest('hex') + '-' + language + '.mp3';
		var filepath = path.resolve(webroot, 'tts', filename);

		// If not already downloaded request translation
		fs.stat(filepath, function (err, stat) {
			if (err) {
				console.log('Downloading new tts message file: ' + filepath);
				var file = fs.createWriteStream(filepath);
				var request = http.get(tts_request, function (response) {
					response.pipe(file);
					file.on('finish', function () {
						file.end();
						callback(true, filename);
					});
				}).on('error', function (err) {
					console.error('could not download file', filename, err);
					fs.unlink(dest);
					callback(false);
				});
			} else {
				console.log('Using cached tts message file: ' + filename);
				callback(true, filename);
			}
		});
	}

	Core.prototype.sayWeather = function() {
		getWeather(function(res) {
			res.on('data', function(chunk) {
				var result = JSON.parse(chunk.toString());
				phrase = util.format(TEXT_TO_SPEACH, Math.round(result.main.temp), result.weather[0].description);
				if (INFO || DEBUG) {
					console.log('phrase: ' + phrase);
				}

				var uri = 'http://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(phrase) + '&tl=fr';
				
				if (DEBUG) {
					console.log(uri);
				}

				var sonosInstance = new sonos.Sonos(SONOS_HOST_BAR);	
				sonosInstance.play(uri, function(err, playing) {
					if (DEBUG) {
						console.log('err: ' + err);
						console.log('playing: ' + playing);
					}
				});
			}).on('end', function() {	

			});
		});
	}

	sonosWeatherModule.Core = Core;

})();

new sonosWeatherModule.Core().sayWeather();
