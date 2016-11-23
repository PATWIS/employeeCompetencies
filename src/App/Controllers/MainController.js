(function() {

    'use strict';

    angular.module('app').controller('MainController', ['$scope', 'JSOMService', MainController]);

    function MainController($scope, JSOMService, $timeout) {
 
        $scope.employeeId = getUrlVars();
        $scope.editingData = {};
        $scope.value = new Date(2016, 3, 2);
        $scope.isVisible = true; 
 
        $scope.modify = function(competenceID, data) {

            $scope.editingData[competenceID + '-' + data.Id] = true;
            $scope.isVisible = false;
            console.log(data.Category);

        };
        $scope.save = function(competenceID, data) {
            $scope.editingData[competenceID + '-' + data.Id] = false;
             $scope.isVisible = true;

            

            setNewValue(data);
            $scope.reset();
        };

        $scope.reset = function() {
            $scope.editingData = {};
        };

        var setNewValue = function(i) {
            $scope.competences.forEach(function(competence) {

                competence.Instructions.forEach(function(instruction) {

                    if (instruction.Id === i.Id) {

                        instruction.TrainingDate = i.TrainingDate;
                        instruction.ExpiryDate = addNYears(i.TrainingDate,3);

                    }
                });
            });
        };

        var addNYears = function(date, n) {
            var d = new Date(date);
            d.setFullYear(d.getFullYear() + n);
            return d.toJSON().slice(0, 10);
        }


        function getUrlVars() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
                vars[key] = value;
            });
            return vars.ID;
        }


          // JSOMService.saveChanges($scope.editingData).then(function () {
          //           $scope.hasSpinner = false;
          //           $scope.isSaved = true;
          //           $scope.header = "Success";

          //       });



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

                    var resultLookup = result.reduce(function(lookup, instructionDate) {
                        lookup[instructionDate.Id] = instructionDate;
                        return lookup;
                    }, {});


                    for (var i = 0; i < $scope.competences.length; i++) {

                        var instructions = $scope.competences[i].Instructions;

                        // console.log(instructions);

                        instructions.forEach(function(obj) {

                            var instructionDate = resultLookup[obj.Id];

                            if (instructionDate) {
                                obj.TrainingDate = instructionDate.TrainingDate;
                                obj.ExpiryDate = instructionDate.ExpiryDate;
                            } else {
                                obj.TrainingDate = null;
                                obj.ExpiryDate = null;
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
