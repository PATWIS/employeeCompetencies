(function() {

    'use strict';

    angular.module('app').controller('MainController', ['$scope', 'JSOMService', MainController]);

    function MainController($scope, JSOMService, $timeout) {

        $scope.employeeId = getUrlVars();
        $scope.editingData = {};
        $scope.value = new Date(2016, 3, 2);
         
        $scope.modify = function(data) {
             $scope.editingData = angular.copy(data);
            $scope.editingData[data.IsVisible] = true;
            
        };
        $scope.save = function(data) {
            $scope.editingData[data.IsVisible] = false;
            $scope.editingData.Name="foo";

            $scope.competences.forEach(function(competence){
                $scope.competence.Instructions[data] = angular.copy($scope.editingData);
            })  
            $scope.reset();
        };

        $scope.reset = function() {
            $scope.editingData = {};
        };


        function getUrlVars() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
                vars[key] = value;
            });
            return vars.ID;
        }



        init();

        function init() {

            // var valuesToLoad = 3;
            JSOMService.getEmployeeCompetences($scope.employeeId).then(function(result) {
                $scope.competences = result;
                // console.log($scope.competences);

            }).then(function() {

                var competenceIds = $scope.competences.map(function(competence) {
                    return competence.Id;
                });

                console.log(competenceIds);

                return JSOMService.getCompetenceInstructions(competenceIds).then(function(result) {

                    var resultLookup = result.reduce(function(lookup, instruction) {
                        lookup[instruction.Id] = instruction;
                        return lookup;
                    }, {});

                    console.log(resultLookup);


                    $scope.competences.forEach(function(competence) {
                        var instruction = resultLookup[competence.Id];
                        
                        if (instruction) {
                            competence.Instructions = instruction.Instructions; // added new key in object
                        }

                    });
                });

            }).then(function() {

                JSOMService.getInstructionDates($scope.employeeId).then(function(result) {

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
                                obj.TrainingDate = instructionData.TrainingDate;
                                obj.ExpiryDate = instructionData.ExpiryDate;
                            }

                        });
                    };

                });

            }).then(function() {

                JSOMService.getInstructions().then(function(result) {

                    var resultLookup = result.reduce(function(lookup, instruction) {
                        lookup[instruction.Id] = instruction;
                        return lookup;
                    }, {});


                      for (var i = 0; i < $scope.competences.length; i++) {

                        var instructions = $scope.competences[i].Instructions;

                        // console.log(instructions);

                        instructions.forEach(function(obj) {

                            var instruction = resultLookup[obj.Id];

                            if (instruction) {
                                obj.Category = instruction.Category;
                               
                            }

                        });
                    };



                });

            });;

        }
    }
})();
