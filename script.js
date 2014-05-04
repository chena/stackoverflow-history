function searchHistory(callback) {
  // look for history items in the last year,
  // subtract one year of microseconds from the current time.
  var microseconds = 1000 * 60 * 60 * 24 * 365;
  var start = (new Date).getTime() - microseconds;
  var questions = {}; // object the hold question URLs and their tags

  chrome.history.search({
      'text': 'stackoverflow.com/questions', // look for visits from stackoverflow
      'startTime': start, 
      'maxResults': 100
    },
    function(historyItems) {
      historyItems.forEach(function(item, i) {
        var url = item.url,
            title = item.title;

        var match = url.match(/\/questions\/(\d+)\//i); // extract the questionID
        // only map unique questions that have a title and an URL
        if (match) {
          var qid = match[1];
          if (!questions[qid] && isNotEmpty(title) && isNotEmpty(url)) {
            setQuestionTags(match[1], function(tags) {
              questions[qid] = {
                title: title, 
                url: url,
                tags: tags
              };

              // when we reach the last item, execute the callback
              if (i == historyItems.length - 1) {
                callback(questions);
              }
            });
          }
        }
      });
    });
}

function setQuestionTags(qid, callback) {
  var request = stackExchangeURL + 'questions/' + qid + '?site=stackoverflow&key=57GIfzOADMe0nXAda1LCmw((';
  $.getJSON(request).done(function(question) {
      var items = question.items;
      if (items && items[0]) {
        callback(question.items[0].tags);
      } else {
        return;
      }
      
  });
}

function buildDOM(containerID, questions) {
  var container = $('#'+ containerID);
  for (qid in questions) {
    var question = questions[qid];

    var questionDOM = $('<div/>', {
      'class': 'well' 
    });
    
    var headingDOM = $('<h3/>').append($('<a/>', {
      'href': question.url,
      text: question.title
    }));
    questionDOM.append(headingDOM);

    question.tags.forEach(function(tag) {
      var tagButton = $('<button/>', {
        text: tag
      });
      questionDOM.append(tagButton);
    });

    questionDOM.appendTo(container);
  }
}

function buildDOMClusters(containerID, data) {
  var container = $('#' + containerID);
  var index = 0;
  for (clusterTopics in data) {
    var clusterDOM = $('<div/>', {'data-cluster-index': ++index, 'class':'well'});
    clusterDOM.append($('<h3/>', {text: 'Cluster ' + index}));

    var topicsDOM = $('<div/>', {'class': 'topics'});
    var topicList = clusterTopics.split(',');
    for (var i = 0; i < topicList.length; i++) {
      var topicSpan = $('<button/>', {'text': topicList[i]});
      topicSpan.appendTo(topicsDOM);
    } 
    topicsDOM.appendTo(clusterDOM);

    var showText = '\t[Show Pages]';
    var hideText = '\t[Hide Pages]';
    var toggleDOM = $('<a/>', {'class':'togglePages', text: showText});
    toggleDOM.appendTo(topicsDOM);
    toggleDOM.click(function() {
      var that = $(this);
      var newText = (that.text() == showText) ? hideText : showText;
      that.text(newText);
      that.parent().parent().find('ul').toggle();
    });

    var clusteredPages = data[clusterTopics];
    var pagesDOM = $('<ul/>', {'class': 'pages'});
    for(var i = 0; i < clusteredPages.length; i++) {
      var item = $('<li/>').append($('<a/>', {'href': clusteredPages[i][1], text: clusteredPages[i][0], target: 'blank'}));
      item.appendTo(pagesDOM);
    }
    pagesDOM.appendTo(clusterDOM);
    pagesDOM.hide();
    
    clusterDOM.appendTo(container);
  }
}

function isNotEmpty(str) {
  return (typeof str !== 'undefined') && (str.length > 0);
}

// global variables and constants
var stackExchangeURL = 'http://api.stackexchange.com/2.2/';

searchHistory(function(questions) {
  buildDOM('results', questions);
});


