'use strict';

angular
	.module('StackoverflowHistory', [])
	.factory('StackExchangeService', stackExchangeService)
	.factory('HistoryService', historyService)
	.controller('PageController', pageController)
	.controller('WordCloudController', wordCloudController)
	.directive('wordCloud', wordCloud);

function stackExchangeService($http, $q) {
	var baseURL = 'http://api.stackexchange.com/2.2/questions/';

	return {
		// return a promise with tagged questions
		getQuestionsTags: function(questions) {
			var deferred = $q.defer();
			var qids = Object.keys(questions).join(';');

			$http.get('key.json').then(function(resp) {
					return baseURL + qids + '?site=stackoverflow&key=' + resp.data.key;
				}).then(function(requestURL) {
					return $http.get(requestURL);
				}).then(function(result) {
					result.data.items.forEach(function(question) {
						questions[question.question_id].tags = question.tags;
					});
					deferred.resolve(questions);
				})
				.catch(function(response){
					deferred.reject(response);
				});

			return deferred.promise;
		}
	};
}

function historyService($q) {
	var isNotEmpty = function(str) {
		return (typeof str !== 'undefined') && (str.length > 0);
	};

	return {
		// return a promise with SO questions from history
		search : function() {
			var microseconds = 1000 * 60 * 60 * 24 * 30; // a month in microseconds
			var start = (new Date()).getTime() - microseconds;

			var questions = {}; // object that hold question URLs and visited time
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
}

function pageController($scope, HistoryService, StackExchangeService) {
	$scope.view = 'history';
	$scope.questions = {};
	$scope.currentPage = 0;
	$scope.pageLimit = 10;

	var toArray = function(map) {
		var array = [];
		for (var key in map) {
			array.push(map[key]);
		}
		return array;
	};

	HistoryService.search()
		.then(function(questions) {
			// getQuestionsTags returns a promise
			return StackExchangeService.getQuestionsTags(questions);
		})
		.then(function(taggedQuestions) {
 			$scope.questions = toArray(taggedQuestions);
		});

	$scope.search = function(tag) {
		$scope.keyword = tag;
	};

}

function wordCloudController($scope) {
	$scope.setTagsData = function() {
		var tags = {};

		$scope.questions.forEach(function(question) {
			question.tags.forEach(function(tag) {
				if (tags[tag]) {
					tags[tag] += 1;
				} else {
					tags[tag] = 1;
				}
			});
		})

		$scope.tags = tags;
	};

	$scope.$watch('view', function() {
		if ($scope.view === 'cloud') {
			$scope.setTagsData();
		}
	});
	
}

// word cloud directive for our tags
// TODO: generate workd cloud based on a date range
function wordCloud() {
	return {
		restrict: 'E', // restrict to element
		scope: {
			tags: '=words' // put tags into the directive's scope, specified by attribute name 'words'
		},
		link: function (scope, element, attrs) {
			// create a reference for the container for the cloud
			var svg = d3.select(element[0]).append('svg');

			scope.render = function(data) {
				// remove everything before drawing the cloud
				// otherwise it will try to draw on top of the existing cloud
				svg.selectAll('*').remove();

				// create a foreign object for tooltip to be appended inside our svg element
				// because we cannot directly append HTML element inside an svg
				var tooltip = svg.append("foreignObject");

				var wordCount = data;
				if (!wordCount) return;
				
				var fill = d3.scale.category20();

				d3.layout.cloud().size([400, 400])
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
					svg.attr('width', 400)
						.attr('height', 400)
						.append('g')
							.attr('transform', 'translate(200,200)')
						.selectAll('text').data(words)
						.enter()
						.append('text')
							.style('font-size', function(d) {
								return d.size + 'px'; 
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
				        .on('mouseover', function(d) {
				        	// first remove existing tooltips
				        	tooltip.selectAll('*').remove();
				        	tooltip.append("xhtml:body")
                                .html("<span style='position:absolute; " + 
                                	"transform:translate("+ (d.x + d.width + 100) + "px," + (d.y + d.height + 200) +"px);'" +
                                	"class='tooltip'>count: " + d.count + "</span>");
				        });
				}
			};

			// watch for values of words attribute attached to the directive
			// and call render
			scope.$watch(attrs.words, function() {
				scope.render(scope.tags);
			});
		}
	};
}
