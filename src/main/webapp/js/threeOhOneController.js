'use strict';

/* Controllers */

angular.module("dartsApp.controller", []);
function threeOhOneController($scope, $http, $log, $location, postDataService, ohOneScoreCalculator) {
  $scope.targetData = {};
  $scope.targetData.isShowRounds = false;
  $scope.isShowChart = false;
  $scope.targetData.turn = [];
  $scope.targetData.turnCounter = 1;
  $scope.targetData.dartCounter = 0;
  // placeholder for keeping track of the double/triple state
  $scope.targetData.modifier = "";

  // helps display which dart to update
  $scope.targetData.dartToUpdate = "";

  // theoretically we could hold multiple turns or darts in here?
  $scope.targetData.results = [];

  // there is a turn score i guess
  $scope.targetData.score = 0;

  // hold the average data we get from the database
  $scope.targetData.averages = [];

  // hold the combined average data (new darts and db info)
  $scope.targetData.combinedAverages = [];

  // urls required for loading and posting data
  $scope.targetData.postUrl = "/data/301";
  $scope.targetData.loadUrl = "/data/load301";

  // determines if 'show all' button will be present
  $scope.needsShowAll = true;

  // toggling a class name for showing all results
  $scope.displayShowAll = "hide";

  // order by date descending
  $scope.predicate = '-dateMillis';

  // model used in selectEditRound method
  $scope.targetData.selectedEditRound = {};

  $scope.targetData.targetScore = 301;
  $scope.targetData.remainingScore = 301;

  // set the default target
  $scope.target = {};

  $scope.targetData.isEditMode = false;

  $scope.checkRoundsComplete = function() {
    return $scope.targetData.remainingScore == 0;
  }

  /***************** data loading and saving methods **********************/

  /*
  * this is going to be a little interesting, since we are batch posting
  * also should post number of rounds and the number you took out
  */
  $scope.postResult = function() {
    var myjson = JSON.stringify($scope.targetData.results, replacer);
    $http.post($scope.targetData.postUrl, myjson).
      success(function(data, status) {
        $scope.targetData.reset();
        $log.info("posted successfully");
      }).
      error(function(data, status) {
        postData.data = data || "Request failed";
        postData.status = status;
      });
  }
  //  postDataService($scope.createNewResult, $scope.targetData, $scope.targetData.reset);
  //}

  /*
  * this is called from postDataService, so that it can create the new result appropriately
  */
  $scope.createNewResult = function(data) {
      // only thing we need to do is update the average, so i guess we either get the total score and number of darts and keep track of it in js, or else we have to
      // constantly hit the database to get the average, which is silly i think.
      //return {'date' : data.displayDateTime, 'score' : data.score, 'dateMillis' : data.dateMilliseconds, 'numRounds' : data.numRounds, 'avg' : avg, 'id' : data.id}
  }

  /*
  * called from cancel game
  */

  $scope.targetData.reset = function() {
    $scope.targetData.isShowRounds = false;
    $scope.targetData.results = [];
    $scope.targetData.turn = [];
    $scope.targetData.modifier = "";
    $scope.targetData.remainingScore = 301;
    $scope.targetData.dartCounter = 0;
    $scope.targetData.turnCounter = 1;
  }

  /*
  * gamesContainer is where we store the games that we parse from the response.  for the first request
  * we store them in the view container, for the lifetime stats we store them in a hidden container
  */
  $scope.getResults = function(url, gamesContainer) {
    $http.get(url).
          success(function(data, status) {
            $scope.parseResults(data);
          }).
          error(function(data, status) {
            $log.error("failed")
          })
  }

  $scope.parseResults = function(data) {
    //var aggregateData = data.aggregateData
    var aggregateData = data
    if (aggregateData) {
      for (var i=0; i<aggregateData.length; i++) {
        var tempData = aggregateData[i];
        var avgData = {};
        avgData.type = tempData.type;
        avgData.score = tempData.score;
        avgData.numDarts = tempData.numDarts;
        avgData.targetAverage = (avgData.score / avgData.numDarts).toFixed(1);
        $scope.targetData.averages.push(avgData);
        $scope.targetData.combinedAverages = $scope.targetData.averages.slice(0);
      }
    }
  }


  /************** User/view initiated methods *****************/

  /*
  * toggleModifier allows the modifier (double/triple button) to be turned on or off, even if repeatedly clicked
  */
  $scope.toggleModifier = function(modifier) {
    if ($scope.targetData.modifier == modifier) {
      $scope.targetData.modifier = "";
    } else {
      $scope.targetData.modifier = modifier;
    }
  }

  /*
  * method to help visualize which dart is being edited (in a previously entered result)
  */
  $scope.toggleDartToUpdate = function(dartToUpdate) {
    if ($scope.targetData.dartToUpdate == dartToUpdate) {
      $scope.targetData.dartToUpdate = "";
    } else {
      $scope.targetData.dartToUpdate = dartToUpdate;
    }
  }


  /*
  * cancel a game - clear the current game data
  */
  $scope.cancelGame = function() {
      $scope.targetData.reset();
  }

  /*
  * called from button on front end - loads the chart if there is data
  * not sure a chart makes sense here.
  $scope.showChart = function() {
    $scope.isShowChart = true;
    if ($scope.targetData.allGames.length > 0) {
      chartService($scope.targetData.allGames);
    }
  }
*/

  /*
  * works with front end code to select a round for editing
  * ng-show="selectedEditRound == result"
  */
  $scope.selectEditRound = function(item) {
    $scope.targetData.selectedEditRound = item;
    $scope.targetData.isEditMode = true;
  }

  /*
  * called after saving a round edit - updates a particular round's score
  * and then calls update score to update the game score
  */
  $scope.finishEditing = function(result) {
    $scope.scoreDart(result.dart, result.type);
    $scope.targetData.selectedEditRound = {};
    $scope.updateScore(result);
    $scope.targetData.dartToUpdate = "";
    $scope.targetData.isEditMode = false;
  }

  /*
  * flip the visibility of the rounds section, called from the start button on the view
  */
  $scope.showRounds = function() {
    $scope.targetData.isShowRounds = true;
  }

  /*************** score management methods *****************/

  /*
  * this method gets called every time a score button is clicked.
  * every dart should be scored individually and added to the total averages
  */
  $scope.markDart = function(dart) {
    if ($scope.targetData.modifier) {
      dart = $scope.targetData.modifier + dart;
    }
    // if we are not in edit mode, go ahead and mark the dart in the results
    if (!$scope.targetData.isEditMode) {
      // round result is used to show the darts that have been selected in the current turn
      $scope.targetData.turn.push(dart);

      // score after every dart, but only send to the database on save.
      // can maybe temp save in local storage so there is some durability/safety
      var score = $scope.scoreDart(dart);
      var newResult = {'type' : '301', 'dart' : dart, 'score' : score, 'dateMilliseconds' : new Date().getTime(), 'turn' : $scope.targetData.turnCounter};
      $scope.targetData.results.push(newResult);
      $scope.updateScore();


    } else {
      // we are in edit mode wheeeee
      // this needs work...
      $scope.targetData.selectedEditRound.dart = dart;
      $scope.targetData.selectedEditRound.score = $scope.scoreDart(dart);

      $scope.updateScore();
    }

    $scope.targetData.modifier = "";
  }

  /*
  * responsible for updating the score every turn, and managing the cleanup for the next turn
  */
  $scope.scoreDart = function(dart) {
    if (typeof(dart) == "number") {
      dart = dart.toString();
    }
    return ohOneScoreCalculator(dart);
  }

  $scope.hideTriple = function() {
    return false;
  }

  /*
  *   we need to deal with turns and individual darts here.
  *   the score should be updated on each dart, but it needs to be aware of turns.
  *
  */
  $scope.updateScore = function() {
    var newResults = $scope.targetData.results;
    var isIncrementTurn = false;

    // each time we update the score, start off with the full score again
    $scope.targetData.remainingScore = $scope.targetData.targetScore;

    // only start scoring after we are doubled in
    var isDoubledIn = false;


    var resultsLength = $scope.targetData.results.length;
    for (var i=0; i<resultsLength; i++) {
      var result = $scope.targetData.results[i];

      // if we aren't double in yet, check each dart in the results until we are
      if (!isDoubledIn) {
        var dart = result.dart;
        if (typeof(dart) == "number") {
          dart = dart.toString();
        }
        // check if it is a double, if not, continue;
        if (dart.lastIndexOf("d", 0) !== 0) {
          result.score = 0;
          continue;
        } else {
          isDoubledIn = true;
        }
      }

      if (isDoubledIn) {
        $scope.targetData.remainingScore -= result.score;
      }
    }

    if ($scope.targetData.remainingScore == 0) {

      // check if the last dart was a double
      var lastDart = $scope.targetData.results[resultsLength - 1];
      var lastDartResult = lastDart.dart;
      if (typeof(lastDartResult) == "number") {
        lastDartResult = lastDartResult.toString();
      }

      // if the last dart was not a double, zero out the scores for the last turn
      if (lastDartResult.lastIndexOf("d", 0) !== 0) {
        $scope.setLastTurnScoresToZero();
      }
    } else if ($scope.targetData.remainingScore < 2) {
      $scope.setLastTurnScoresToZero();
      isIncrementTurn = true;
    }

    if (isIncrementTurn || $scope.targetData.dartCounter == 2) {
      $scope.targetData.dartCounter = 0;
      $scope.targetData.turnCounter++;
      $scope.targetData.turn = [];
    } else {
      $scope.targetData.dartCounter++;
    }


  }

  $scope.isHideCancel = function() {
    return $scope.targetData.results.length == 0 || $scope.targetData.isEditMode;
  }

  $scope.setLastTurnScoresToZero = function() {
    var turnToRollBack = $scope.targetData.turnCounter;
    for (var i=0; i<$scope.targetData.results.length; i++) {
      var dart = $scope.targetData.results[i];
      if (dart.turn == turnToRollBack) {
        dart.score = 0;
      }
    }
    $scope.updateScore();
  }


}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

