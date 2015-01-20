#!/usr/bin/env nod

var sonosWeatherModule = sonosWeatherModule || {};

(function(){
	var http = require('http');
	var util = require('util');

	var SONOS_HOST = 'localhost';
	var SONOS_PORT = 5005;

	var TEXT_TO_SPEACH = 'Salut.' + getDateTime() + 'Dehors il fait %s° et %s';
	var textToSpeach = 'Salut';

	var INFO = true;
	var DEBUG = false;

	var NUMBER_OF_LOOP = 20;
	var VOLUME_DIFFERENCE = 12;

	function Core() {
	};

	function callTts(_message, _callback) {
		var options = {
			host: SONOS_HOST, 
			port: SONOS_PORT, 
			path: '/Salon/say/' + encodeURIComponent(_message) + '/fr', 
			agent: false
		};

		httpGet('callTts', options, function (res){
			_callback(res);
		})
	}

	function playFavorite(_callback) {
		var options = {
			host: SONOS_HOST,
			port: SONOS_PORT,
			path: '/Salon/favorite/Hotmixradio%20Lounge',
			agent: false
		};

		httpGet('playFavorite', options, function (res){
			_callback(res);
		})
	}

	function playNext(_callback) {
		var options = {
			host: SONOS_HOST,
			port: SONOS_PORT,
			path: '/Salon/next',
			agent: false
		};

		httpGet('playNext', options, function (res){
			_callback(res);
		})
	}

	function setVolume(_volume, _callback) {
		var options = {
			host: SONOS_HOST,
			port: SONOS_PORT,
			path: '/Salon/volume/' + _volume,
			agent: false
		};

		httpGet('setVolume ' + _volume, options, function (res){
			_callback(res);
		})
	}

	function pause(_callback) {
		var options = {
			host: SONOS_HOST,
			port: SONOS_PORT,
			path: '/Salon/pause',
			agent: false
		};

		httpGet('pause', options, function (res){
			_callback(res);
		})
	}

	function play(_callback) {
		var options = {
			host: SONOS_HOST,
			port: SONOS_PORT,
			path: '/Salon/play',
			agent: false
		};

		httpGet('play', options, function (res){
			_callback(res);
		})
	}

	function getState(_callback) {
		var options = {
			host: SONOS_HOST,
			port: SONOS_PORT,
			path: '/Salon/state',
			agent: false
		};

		httpGet('getState', options, function (res){
			_callback(res);
		})
	}

	function getWeather(_callback) {
		//7e930cac4386e0635a46111574740b2

		var openWeatherMapAppId = process.env.SONOS_WEATHER_API_ID || null;
		var pathOpenWeatherMap = '/data/2.5/weather?id=2973783&lang=fr&units=metric';

		if (openWeatherMapAppId) {
			pathOpenWeatherMap = pathOpenWeatherMap + '&appid=' + openWeatherMapAppId;
		}

		var options = {
			host: 'api.openweathermap.org',
			path: pathOpenWeatherMap,
			agent: false
		};

		if (INFO) {
			console.log('OpenWeatherMap path (with API ID ?): ' + pathOpenWeatherMap);
		}

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
			_callback(null)
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

	(function(){
		if(console.log){
			var old = console.log;
				console.log = function(){
					Array.prototype.unshift.call(arguments, 'SONOS TTS -- ' + new Date().toLocaleString(), ': ');
					old.apply(this, arguments)
			}
		}  
	})();

	function withTimeout() {
		getWeather(function(resWeather) {
			resWeather.on('data', function(chunk) {
				var result = JSON.parse(chunk.toString());

				textToSpeach = util.format(TEXT_TO_SPEACH, Math.round(result.main.temp), result.weather[0].description);
				if (INFO || DEBUG) {
					console.log('textToSpeach: ' + textToSpeach);
				}
			}).on('end', function(chunk) {
				pause(function(resPause) {
					resPause.on('end', function() {
						setVolumePlus(function (resVP) {
							resVP.on('end', function() {
								callTts(textToSpeach, function(res) {
									res.on('end', function(res) {
										var waitBeforeVolumeMinus = 1;
										setTimeout(function() {
											getState(function(resState) {
												resState.on('data', function(d) {
													var result = JSON.parse(d.toString());
													waitBeforeVolumeMinus = (result.currentTrack.duration * 1000) - 2000;
													console.log(waitBeforeVolumeMinus);
												}).on('end', function() {
													setTimeout(function() {
														setVolumeMinus(function (resVM) {
															resVM.on('end', function() {
																/*
																playNext(function(resNext) {
																	resNext.on('end', function() {
																		play(function(resPlay) {
																			resPlay.on('data', function() {
																			}).on('end', function() {
																				console.log('end');	
																			});
																		});
																	});
																});
																*/
																playFavorite(function(resPlayFav) {
																	resPlayFav.on('end', function() {
																		console.log('end');	
																	});
																});
															});
														});
													}, 2000 + waitBeforeVolumeMinus);
												});
											});
										}, 4000);
									});
								});
							});
						});
					});
				});	
			});
		});
	}


	Core.prototype.sayWeather = function() {
		getWeather(function(res) {
			res.on('data', function(chunk) {
				var result = JSON.parse(chunk.toString());

				textToSpeach = util.format(TEXT_TO_SPEACH, Math.round(result.main.temp), result.weather[0].description);
				if (INFO || DEBUG) {
					console.log('textToSpeach: ' + textToSpeach);
				}
			}).on('end', function() {
				pause(function(res) {
					res.on('end', function() {
						setVolume('+' + VOLUME_DIFFERENCE, function (res) {
							res.on('end', function() {
								callTts(textToSpeach, function(res) {
									res.on('end', function(res) {
										var firstStopPassed = false;
										var blablaPassed = false;

										var getStateInTimeoutLoop = function (i) {
											getState(function(res) {
												res.on('data', function(chunk) {
													chunk = JSON.parse(chunk.toString());

													if (INFO) {
														console.log('getState in loop ' + i + ': ' + chunk.playerState); 
													}

													if (chunk.playerState == 'STOPPED' && !firstStopPassed) {
														firstStopPassed = true;
														setTimeout(function () { getStateInTimeoutLoop(i + 1) }, 1000);
													} else if (chunk.playerState == 'PLAYING' && !blablaPassed) {
														blablaPassed = true;
														setTimeout(function () { getStateInTimeoutLoop(i + 1) }, 1000);
													} else if (chunk.playerState == 'STOPPED' && firstStopPassed && blablaPassed) {

														playFavorite(function(res) {
															res.on('end', function() {
																setVolume('-' + VOLUME_DIFFERENCE, function(res) {
																	res.on('end', function() {

																		console.log('fin');

																	})
																});
															});
														});

													} else if (i < NUMBER_OF_LOOP) {
														setTimeout(function () { getStateInTimeoutLoop(i + 1) }, 1000);
													}

												});
											});
										}

										getStateInTimeoutLoop(0);
									});
								});
							});
						});
					});
				});
			});
		})
	}

	sonosWeatherModule.Core = Core;
})();

new sonosWeatherModule.Core().sayWeather();
