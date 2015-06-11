angular.module('starter.services', [])

.factory('Movie', function($http, $q, $localstorage) {
  var searchImdb = function(text) {
    var q = $q.defer();

    $http.get('http://omdbapi.com?type=movie&s=' + text)
      .then(function(result) {
        console.log(result.data);
        q.resolve(result.data.Search);
    });

    return q.promise;
  };

  var detailImdb = function(id) {
    var q = $q.defer();

    $http.get('http://omdbapi.com?type=movie&i=' + id)
      .then(function(result) {
        console.log(result.data);
        q.resolve(result.data);
      });

    return q.promise;
  }

  return {
    search: function(text) {
      return searchImdb(text);
    },
    detail: function(id) {
      return detailImdb(id);
    },
    fromStore: function() {
      return $localstorage.getObject('movies');
    },
    initStore: function() {
      $localstorage.setObject('movies', []);
      return $localstorage.getObject('movies');
    },
    hasStore: function() {
      var store = $localstorage.getObject('movies');
      if (store === undefined) return false;
      return Object.keys(store).length !== 0;
    },
    addToStore: function(movie) {
      var movies = $localstorage.getObject('movies');
      movies.push(movie);
      $localstorage.setObject('movies', movies);
    },
    addToHistoryStore: function(movie) {
      var movies = $localstorage.getObject('moviesHistory');
      if (movies === undefined || Object.keys(movies).length == 0)
        movies = [];
      movies.push(movie);
      $localstorage.setObject('moviesHistory', movies);
    },
    removeFromStore: function(movie) {
      var movies = $localstorage.getObject('movies');
      var index = -1;
      for (var i = 0; i < movies.length; ++i)
        if (movies[i].imdbID == movie.imdbID)
          index = i;
      if (index > -1)
        movies.splice(index, 1);
      $localstorage.setObject('movies', movies);
    }
  };
});
