(function() {

    'use strict';

    angular.module('app').controller('RaportController', ['$scope', 'JSOMService', RaportController]);

    function RaportController($scope, JSOMService) {
       
        init();

        function init() {

            // function containstCompetence(competence) {

            // }

            return JSOMService.getEmployees().then(function(result) {

                $scope.employees = result;

            }).then(function() {

                return JSOMService.getCompetences().then(function(result) {


                    var resultLookup = result.reduce(function(lookup, competence) {
                        lookup[competence.Id] = competence;
                        return lookup;
                    }, {});


                    $scope.employees.forEach(function(employee) {

                        $scope.competences = [];
                        employee.Competences.forEach(function(obj) {

                            var competence = resultLookup[obj.Id];
                            if (competence) {
                                $scope.competences.push(competence);
                            }

                        });
                        employee.Competences = $scope.competences;
                    });

                });

            }).then(function() {
                // LOAD HERHALING DATA LIST Items --- result 
                return JSOMService.getHerhalingData().then(function(result) {
                    $scope.Datas = result;

                    var resultLookupEmployeeInstructionsExist = result.reduce(function(lookup, instructionData) {
                        lookup[instructionData.InstructieId + ',' + instructionData.MedewerkerId] = instructionData;
                        return lookup;
                    }, {});

                    var resultLookupMedewerkerId = result.reduce(function(lookup, instructionData) {
                        lookup[instructionData.MedewerkerId] = instructionData;
                        return lookup;
                    }, {});

                    $scope.finalObject = [];

                    var currentEmployeeName;
                    var currentInstructionName;

                    $scope.employees.forEach(function(employee) {

                        var employeeInstructions = $scope.Datas.filter(function(r) {
                            return r.MedewerkerId === employee.Id;
                        })

                        if (!employeeInstructions.length) {
                            return;
                        }

                        employee.Competences.forEach(function(competence) {

                            competence.Instructions.forEach(function(instruction) {

                                    var existEmployee = resultLookupMedewerkerId[employee.Id];

                                    if (!existEmployee) {
                                        return;
                                    }

                                    var existInstruction = resultLookupEmployeeInstructionsExist[instruction.Id + ',' + employee.Id];

                                    if (!existInstruction) {
                                        return;
                                    }

 

                                    $scope.inNMonths = function(n) {
                                        var d = new Date();
                                        d.setMonth(d.getMonth() + n);
                                        return d.toJSON().slice(0, 10);
                                    }

                                    function toJSONLocal(date) {
                                        var local = new Date(date);
                                        local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                                        return local.toJSON().slice(0, 10);
                                    }

                                    $scope.lessThan = function(prop, val) {
                                        return function(obj){
                                            var expirty = toJSONLocal(prop);
                                            if (obj[prop] < inNMonths(val)) return true;
                                        }
                                    } 


                                    $scope.expirty = toJSONLocal(existInstruction.ExpiryDate);


                                    // if (expirty < inNMonths(1)) {

                                        $scope.finalObject.push({
                                            Name: employee.Name !== currentEmployeeName ? employee.Name : '',
                                            _Name: employee.Name,
                                            Instruction: existInstruction.InstructieName !== currentInstructionName ? existInstruction.InstructieName : '',
                                            Competence: competence.Name,
                                            TrainingDate: existInstruction.TrainingDate,
                                            ExpiryDate: existInstruction.ExpiryDate
                                        });

                                        currentEmployeeName = employee.Name;
                                        currentInstructionName = existInstruction.InstructieName;

                                    // }



                                })
                                // $scope.finalObject.sort(function(a,b) {return (a.Instruction > b.Instruction) ? 1 : ((b.Instruction > a.Instruction) ? -1 : 0);} ); 

                        })



                    })



                });
                    
            }).catch(function (errorMsg) {
                    $scope.error = errorMsg;
                });

        }
    }
})();
