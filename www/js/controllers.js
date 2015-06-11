angular.module('starter.controllers', ['ngSanitize'])

.config(function($provide) {
    $provide.decorator('$state', function($delegate, $stateParams) {
        $delegate.forceReload = function() {
            return $delegate.go($delegate.current, $stateParams, {
                reload: true,
                inherit: false,
                notify: true
            });
        };
        return $delegate;
    });
})

.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}])

.filter('rating', function($sce) {
  return function(input) {
    var rating = parseFloat(input) / 2.0;
    var ratingInt = Math.floor(rating);
    var html = '';
    for (var i = 0; i < ratingInt; ++i)
      html += '<i class="icon ion-android-star"></i>';
    if (ratingInt != rating)
      html += '<i class="icon ion-android-star-half"></i>';
    for (var i = ratingInt + 1; i < 5; ++i)
      html += '<i class="icon ion-android-star-outline"></i>';
    return $sce.trustAsHtml(html);
  }
})
.filter('ratingAllocine', function($sce) {
  return function(input) {
    var rating = parseFloat(input);
    var ratingInt = Math.floor(rating);
    var html = '';
    for (var i = 0; i < ratingInt; ++i)
      html += '<i class="icon ion-android-star"></i>';
    if (ratingInt != rating)
      html += '<i class="icon ion-android-star-half"></i>';
    for (var i = ratingInt + 1; i < 5; ++i)
      html += '<i class="icon ion-android-star-outline"></i>';
    return $sce.trustAsHtml(html);
  }
})
.filter('movieTitleYear', function() {
  return function(movie) {
    if (movie === undefined)
      return 'Loading...';
    else
      return movie.Title + ' (' + movie.Year + ')';
  }
})

.controller('DashCtrl', function($scope, $ionicActionSheet, $timeout, $interval, Movie) {

  if (!Movie.hasStore()) {
    Movie.initStore();
  }

  // refresh ugly style
  document.indexNeedsRefresh = false;
  $scope.periodicallyRefresh = function() {
    if (document.indexNeedsRefresh) {
      console.log('Refreshing dashboard');
      $scope.refreshStore();
      document.indexNeedsRefresh = false;
    }
  }
  $interval($scope.periodicallyRefresh, 3000);

  $scope.refreshStore = function() {
    $scope.movies.length = 0;
    $scope.movies.push.apply($scope.movies, Movie.fromStore());
  }

  $scope.movies = Movie.fromStore();

  $scope.extendedView = false;

  window.mainScope = $scope;

  $scope.show = function(movie) {

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<i class="icon ion-checkmark-circled balanced"></i> Seen' },
       { text: '<i class="icon ion-android-open positive"></i> View on IMDb'},
       { text: '<i class="icon ion-minus-circled assertive"></i> Dismiss' }
     ],
     titleText: movie.Title + ' (' + movie.Year + ')',
     cancelText: 'Cancel',
     cancel: function() {
          hideSheet();
     },
     buttonClicked: function(index) {
       if (index == 0) {
         Movie.addToHistoryStore(movie);
         Movie.removeFromStore(movie);
         $scope.refreshStore();
       } else if (index == 1) {
         window.open('http://www.imdb.com/title/' + movie.imdbID + '/', '_system', 'location=yes');
       } else if (index == 2) {
         Movie.removeFromStore(movie);
         $scope.refreshStore();
       }
       return true;
     }
   });
 };

  $scope.toggleView = function() { $scope.extendedView = !$scope.extendedView; };
})

.controller('SearchCtrl', function($scope, $http, $timeout, $ionicLoading, Movie) {
  $scope.movies = [];
  $scope.title = '';
  $scope.useAllocine = false;

  sha = function(text) {
    return new jsSHA(text, "TEXT").getHash("SHA-1", "B64");
  }

  document.getElementById("title").focus();

  $scope.delay = (function() {
    var promise = null;
    return function(callback, ms) {
      $timeout.cancel(promise);
      promise = $timeout(callback, ms);
    };
  })();

  $scope.search = function() {
    $scope.loading = true;
    $timeout(function() {$scope.showForceRefresh = $scope.loading && true;}, 5000);
    var text = document.getElementById("title").value;
    Movie.search(text + '*', $scope.useAllocine ? 'allocine' : 'imdb').then(function(resp) {
      $scope.movies.length = 0;
      $scope.movies.push.apply($scope.movies, resp);
      $scope.loading = false;
    });
  };


  $scope.quickAdd = function(movie) {
    $ionicLoading.show({
        content: 'Adding to recall list...',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200,
        showDelay: 100
    });

    Movie.detail(movie.imdbID)
      .then(function(resp) {
        Movie.addToStore(resp);
        $ionicLoading.hide();
        var index = 0;
        for (var i = 0; i < $scope.movies.length; ++i)
          if ($scope.movies[i].imdbID == movie.imdbID) {
            index = i;
            break;
          }
        $scope.movies.splice(index, 1);
        document.indexNeedsRefresh = true;
      });
  };
})

.controller('SearchDetailCtrl', function($scope, $state, $stateParams, $timeout, $controller, Movie) {
  $scope.refresh = function() {
    $scope.loading = true;
    $timeout(function() {$scope.showForceRefresh = $scope.loading && true;}, 5000);
    Movie.detail($stateParams.id).then(function(resp) { $scope.movie = resp; $scope.loading = false; });
  };

  $scope.recall = function() {
    Movie.addToStore($scope.movie);
    $controller('DashCtrl', {$scope: window.mainScope}).refreshStore();
    document.indexNeedsRefresh = true;
    $state.go('^');
  };

  $scope.refresh();
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
