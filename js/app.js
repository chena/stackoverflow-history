var app = angular.module('StackoverflowHistory', []);

// StackExchange API base URL
app.constant('StackExchangeConst', {
	baseURL: 'http://api.stackexchange.com/2.2/questions/',
	key: '57GIfzOADMe0nXAda1LCmw(('
});

app.factory('StackExchangeService', function($http, StackExchangeConst) {
	var getRequestURL = function(qid) {
		return StackExchangeConst.baseURL + qid + '?site=stackoverflow&key=' + StackExchangeConst.key;
	}

	var service = {
		getQuestionTags: function(qid) {
			return $http.get(getRequestURL(qid)).then(function(result) {
				var items = result.data.items;
				if (items && items[0]) {
					return items[0].tags;
				}
			});
		}
	};

	return service;
});

app.factory('HistoryService', function(StackExchangeService) {
	var isNotEmpty = function(str) {
		return (typeof str !== 'undefined') && (str.length > 0);
	}

	var service = {
		search : function(callback) {
			var microseconds = 1000 * 60 * 60 * 24 * 365;
			var start = (new Date).getTime() - microseconds;
			var questions = {}; // object the hold question URLs and their tags

			// TODO: sort history items
			chrome.history.search({
				'text' : 'stackoverflow.com/questions', // look for visits from stackoverflow
				'startTime' : start,
				'maxResults' : 5
			}, function(historyItems) {
				historyItems.forEach(function(item, i) {
					var url = item.url, title = item.title;
					var match = url.match(/\/questions\/(\d+)\//i); // extract the questionID
					
					// only map unique questions that have a title and an URL
					if (match) {
						var qid = match[1];
						if (!questions[qid] && isNotEmpty(title) && isNotEmpty(url)) {
							StackExchangeService.getQuestionTags(qid).then(function(tags) {
								questions[qid] = {
									title : title,
									url : url,
									tags : tags
								}
							});

							if (i == historyItems.length - 1) {
								callback(questions);
							}
						}
					}
				});
			});
		}
	};

	return service;
});

app.controller('PageController', function($scope, HistoryService) {
	HistoryService.search(function(questions) {
		// wrap in apply so angular knows when to bind our data
		$scope.$apply(function() {
			$scope.questions = questions;
			// TODO: get all tags 
		});
	});
});