'use strict';

/* Controllers */

angular.module("dartsApp.controller", []);
function mainController($scope, $http, $log, $location, postDataService, scoreCalculator) {
  $scope.targetData = {};
  $scope.targetData.isShowRounds = false;
  $scope.isShowChart = false;
  $scope.targetData.turn = [];
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
  $scope.targetData.postUrl = "/data/free";
  $scope.targetData.loadUrl = "/data/loadFree";

  // determines if 'show all' button will be present
  $scope.needsShowAll = true;

  // toggling a class name for showing all results
  $scope.displayShowAll = "hide";

  // order by date descending
  $scope.predicate = '-dateMillis';

  // model used in selectEditRound method
  $scope.targetData.selectedEditRound = {};

  // here is an old array that included doubles and triples.  not sure how i feel about that.
  //$scope.targetTypes = [{id : "bull", label : "bullseye"}, {id : "t20", label : "triple 20"}, {id : "d20", label : "double 20"}, {id : "20", label :"20"},
  //                        {id : "t19", label : "triple 19"}, {id : "d19", label : "double 19"}, {id : "19", label : "19"}];

  // the available targets.  this could be expanded.
  $scope.targetTypes = [{id : "bull", label : "bullseye"}, {id : "20", label :"20"}, {id : "19", label :"19"}, {id : "18", label :"18"}, {id : "17", label :"17"},
                          {id : "16", label :"16"}, {id : "15", label :"15"}]

  // set the default target
  $scope.target = $scope.targetTypes[0];

  $scope.targetData.isEditMode = false;


  /***************** data loading and saving methods **********************/

  /*
  * this is going to be a little interesting, since we are batch posting
  */
  $scope.postResult = function() {
    var myjson = JSON.stringify($scope.targetData.results, replacer);
    $http.post($scope.targetData.postUrl, myjson).
      success(function(data, status) {
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
    $scope.targetData.averages = [];
    $scope.targetData.combinedAverages = [];
    // theoretically we could be updating the average with each dart or turn or something, so we can hold onto the original values for the averages,
    // if we cancel the round we could reset to the old averages.
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

  /*
  * standardized method to load the initial data.  not sure it is totally necessary.
  */
  $scope.getData = function() {
    // load the averages data
    $scope.getResults($scope.targetData.loadUrl, $scope.targetData.averages);
  }

  /*
  * load up the data when we get here...
  */
  $scope.getData();





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
      $scope.getData();
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
      var score = $scope.scoreDart(dart, $scope.target.id);
      var newResult = {"type" : $scope.target.id, "dart" : dart, "score" : score, 'dateMilliseconds' : new Date().getTime()};
      $scope.targetData.results.push(newResult);
      $scope.updateScore();

      if ($scope.targetData.turn.length >= 3) {
        $scope.turn = [];
      }
    } else {
      // we are in edit mode wheeeee
      // this needs work...
      $scope.targetData.selectedEditRound.dart = dart;
      $scope.updateScore();
    }

    $scope.targetData.modifier = "";
  }

  /*
  * responsible for updating the score every turn, and managing the cleanup for the next turn
  */
  $scope.scoreDart = function(dart, target) {
    var score = 0;
    if (typeof(dart) == "number") {
      dart = dart.toString();
    }
    if (dart.indexOf(target) !== -1) {
      score = scoreCalculator(dart);
    }

    return score;
    // okay so we have the dart, the target and the score, so we create this object and add it to a list of darts to save
    // and we aggregate this list and add that aggregate to the database to get the moving average.
    // what could possibly go wrong...
    // on save we shove results into the database

  }

  $scope.hideTriple = function() {
    return target.id == 'bull';
  }

  /*
  * update the score - add the new results to the aggregated results
  * but don't aggregate the damn results together, because then lol good luck when you edit a turn
  */
  $scope.updateScore = function() {
    var newResults = $scope.targetData.results;
    $scope.targetData.combinedAverages = $scope.targetData.averages.slice(0);
    console.log($scope.targetData.combinedAverages);
    //console.log($scope.targetData.combinedAverages);

    // for each of the new results,
    for (var i=0; i<newResults.length; i++) {
      var result = newResults[i];
      var isScored = false;
      for (var j=0; j<$scope.targetData.combinedAverages.length;j++) {
        var target = $scope.targetData.combinedAverages[j];
        if (target.type == result.type) {
          target.numDarts++;
          target.score += result.score;
          target.targetAverage = (target.score / target.numDarts).toFixed(1);
          isScored = true;
          break;
        }
      }
      if (!isScored) {
        var newAverage = {};
        newAverage.type = result.type;
        newAverage.numDarts = 1;
        newAverage.score = result.score;
        newAverage.targetAverage = result.score;
        $scope.targetData.combinedAverages.push(newAverage);
      }
    }
  }



  $scope.checkRoundsComplete = function() {
    return $scope.targetData.turn.length > 0;
  }

  $scope.isHideCancel = function() {
    return $scope.targetData.turn.length == 0 || $scope.targetData.isEditMode;
  }

}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

