var app = angular.module('StackoverflowHistory', []);

app.factory('StackExchangeService', function($http, $q, StackExchangeConst) {
	var getRequestURL = function(qid) {
		return StackExchangeConst.baseURL + qid + '?site=stackoverflow&key=' + StackExchangeConst.key;
	};

	var service = {
		getQuestionsTags: function(questions) {
			var deferred = $q.defer();
			var qids = Object.keys(questions).join(';');
			
			$http.get(getRequestURL(qids)).then(function(result) {
				result.data.items.forEach(function(question) {
					questions[question.question_id].tags = question.tags;
				});
				deferred.resolve(questions);
			});
			return deferred.promise;
		}
	};

	return service;
});

app.factory('HistoryService', function($q) {
	var isNotEmpty = function(str) {
		return (typeof str !== 'undefined') && (str.length > 0);
	};

	var service = {
		search : function() {
			var microseconds = 1000 * 60 * 60 * 24 * 365;
			var start = (new Date()).getTime() - microseconds;
			var questions = {}; // object that hold question URLs and their tags
			var deferred = $q.defer();
			
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
							questions[qid] = {
								title : title,
								url : url,
								time: time
							};
						}
					}
				});

				deferred.resolve(questions);
			});
			
			return deferred.promise;
		}
	};

	return service;
});

// TODO: paginate
app.controller('PageController', function($scope, HistoryService, StackExchangeService) {
	$scope.view = 'history';
	$scope.questions = {};

	HistoryService.search()
		.then(function(questions) {
			// getQuestionsTags returns a promise
			return StackExchangeService.getQuestionsTags(questions);
		})
		.then(function(taggedQuestions) {
 			$scope.questions = taggedQuestions;
		});

	$scope.toArray = function(map) {
		var array = [];
		for (var key in map) {
			array.push(map[key]);
		}
		return array;
	};

	$scope.search = function(tag) {
		$scope.keyword = tag;
	};

});

app.controller('WordCloudController', function($scope) {
	$scope.setTagsData = function() {
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

		$scope.tags = tags;
	};

	$scope.showCount = function(tag) {
		console.log(tag.count);
	};

	$scope.$watch('view', function() {
		if ($scope.view === 'cloud') {
			$scope.setTagsData();
		}
	});
	
});

// word cloud directive for our tags
// TODO: pass in D3 dependency here?
app.directive('wordcloud', function() {
	return {
		restrict: 'E', // restrict to element
		//templateUrl: '../_wordcloud.html',
		link: function postlink(scope, element, attrs) {
			var makeCloud = function(wordCount) {
				var fill = d3.scale.category20();

				d3.layout.cloud().size([300, 300])
					.words(Object.keys(wordCount).map(function(word) {
						return {
							text: word, 
							count: wordCount[word],
							size: 10 + wordCount[word]/10 * 80
						};
					}))
					.padding(5)
					.rotate(0)
					.fontSize(function(d) { return d.size; })
					.on('end', draw)
					.start();  

				function draw(words) {
					d3.select('body').append("svg")
							.attr('width', 300)
							.attr('height', 300)
						.append('g')
							.attr('transform', 'translate(150,150)')
						.selectAll('text').data(words)
						.enter()
						.append('text')
							.style('font-size', function(d) {
								return d.size + "px"; 
							})
							.style('font-family', 'Lucida Grande')
							.style('fill', function(d, i) {
								return fill(i); 
							})
						.attr('text-anchor', 'middle')
				        .attr('transform', function(d) {
				        	return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
				        })
				        .text(function(d) {
				          return d.text; 
				        })
				        .style('cursor', 'pointer')
				        .on('click', function(d) {
				        	console.log(d.count);
				        	/*this.append($('<span>', {
				        		text: 'count: ' + d.count,
				        		'class': 'tooltip'
				        	}));*/
				        	angular.element(this)
				        		.append('<span class="tooltip">count: ' + d.count + '</span>');
				        });
				}
			}

			// FIXME: the cloud is redrawn every time
			scope.$watch('view', function() {
				if (scope.view === 'cloud') {
					makeCloud(scope.tags);
				}
			});
		}
	};
});
