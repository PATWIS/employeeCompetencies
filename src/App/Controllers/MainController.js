(function() {

    'use strict';

    angular.module('app').controller('MainController', ['$scope', 'JSOMService', '$timeout', MainController]);

    function MainController($scope, JSOMService, $timeout) {

        // $scope.competences = [];
        // $scope.instructions = [];
        $scope.employeeId = getUrlVars()["ID"];


        function getUrlVars() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {

                vars[key] = value;

            });
            return vars;
        }

        init();

        function init() {

            // var valuesToLoad = 3;
            JSOMService.getCompetences($scope.employeeId).then(function(result) {
                $scope.competences = result;

            }).then(function() {

                var competenceIds = $scope.competences.map(function(competence) {
                    return competence.Id;
                });

                return JSOMService.getInstructions(competenceIds).then(function(result) {

                    var resultLookup = result.reduce(function(lookup, instruction) {
                        lookup[instruction.Id] = instruction;
                        return lookup;
                    }, {});

                    $scope.competences.forEach(function(competence) {
                        var instruction = resultLookup[competence.Id];
                        if (instruction) {
                            competence.Instructions = instruction.Instructions; // added new key in object
                        }

                    });
                });

            }).then(function() {

                JSOMService.getDates($scope.employeeId).then(function(result) {

                   

                    var resultLookup = result.reduce(function(lookup, instructionData) {
                        lookup[instructionData.Id] = instructionData;
                        return lookup;
                    }, {});


                    for (var i = 0; i < $scope.competences.length; i++) {

                        var instructions = $scope.competences[i].Instructions;

                        // console.log(instructions);

                        instructions.forEach(function(obj) {

                            var instructionData = resultLookup[obj.Id];

                            if (instructionData) {
                                obj.DatumAftekenen = instructionData.DatumAftekenen;
                                obj.DatumHerhaling = instructionData.DatumHerhaling;
                            }

                        });
                    };
              
                });

            });

        }
    }
})();