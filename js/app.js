var app = angular.module('StackoverflowHistory', []);

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

			// TODO: ng-click tags then categorize
			// TODO: autocomplete search
			// TODO: clear search
			// TODO: topic cloud with D3
			// TODO: tabs?
			chrome.history.search({
				'text' : 'stackoverflow.com/questions', // look for visits from stackoverflow
				'startTime' : start,
				'maxResults' : 10
			}, function(historyItems) {
				historyItems.forEach(function(item, i) {
					var url = item.url, 
						title = item.title,
						time = item.lastVisitTime;

					var match = url.match(/\/questions\/(\d+)\//i); // extract the questionID
					
					// only map unique questions that have a title and an URL
					if (match) {
						var qid = match[1];
						if (!questions[qid] && isNotEmpty(title) && isNotEmpty(url)) {
							StackExchangeService.getQuestionTags(qid).then(function(tags) {
								questions[qid] = {
									title : title,
									url : url,
									tags : tags, 
									time: time
								}
							});
						}
					}

					// ready to execute callback
					if (i == historyItems.length - 1) {
						callback(questions);
					}
				});
			});
		}
	};

	return service;
});

app.controller('PageController', function($scope, HistoryService) {
	HistoryService.search(function(questions) {
		$scope.toArray = function(map) {
			var array = [];
			for (var key in map) {
				array.push(map[key]);
			}
			return array;
		}

		$scope.search = function(tag) {
			$scope.keyword = tag;
		}

		// wrap in apply so angular knows when to bind our data when they become available
		$scope.$apply(function() {
			$scope.questions = questions;
			// TODO: get all tags 
		});
	});
});

// word cloud directive
/*
app.directive('wordcloud', function() {
	return {
		restrict: 'EA', // restrict to element or attribute
		scope: {
			words: '='
		}, 
	};
});*/