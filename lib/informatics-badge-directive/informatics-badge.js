var scripts = document.getElementsByTagName("script")
var currentScriptPath = scripts[scripts.length-1].src;

angular.module('informatics-badge-directive', [])
.controller('informatics-badge-controller', ['$scope', function($scope) {
  $scope.image_url = currentScriptPath.replace('informatics-badge.js',  'informatics-badge.png');
}])
.directive('informaticsBadge', function() {
  return {
    restrict: 'E',
    templateUrl: currentScriptPath.replace('informatics-badge.js',  'informatics-badge.html')
  };
});
