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

			// TODO: ng-click tags to show count
			chrome.history.search({
				'text' : 'stackoverflow.com/questions', // look for visits from stackoverflow
				'startTime' : start,
				'maxResults' : 30
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
	$scope.view = 'history';

	HistoryService.search(function(questions) {
		$scope.setQuestions(questions);
	});

	$scope.setQuestions = function(questions) {
		// wrap in apply so angular knows when to bind our data when they become available
		$scope.$apply(function() {
			$scope.questions = questions;
		});
	}

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

});

app.controller('WordCloudController', function($scope) {
	$scope.setTagsData = function() {
		var colors = d3.scale.category20();
		var tags = {};

		$scope.toArray($scope.questions).forEach(function(question) {
			question.tags.forEach(function(tag) {
				if (tags[tag]) {
					tags[tag] += 1;
				} else {
					tags[tag] = 1;
				}
			});
		});

		$scope.tags = Object.keys(tags).map(function(tag, i) {
			var count = tags[tag],
				size = 10 + tags[tag]/10 * 80 + 'px';

			return {
				text: tag,
				count: count, 
				size: size, 
				color: colors(i)
			};
		});
	};

	$scope.showCount = function(tag) {
		console.log(tag.count);
	};

	$scope.$watch('view', function() {
		if ($scope.view === 'cloud') {
			$scope.setTagsData();
		}
	})
	
});

// word cloud directive for our tags
app.directive('tagcloud', function() {
	return {
		restrict: 'E', // restrict to element
		templateUrl: '../_tagcloud.html'
	};
});
