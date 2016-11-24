(function() {

    'use strict';

    angular.module('app').controller('RaportController', ['$scope', 'JSOMService', RaportController]);

    function RaportController($scope, JSOMService) {
    
        $scope.finalObject = false;
        $scope.dataFiltersValues = ["Ends for 1 month", "Ends for 2 months", "Ends for 3 months"];
        $scope.dataFilters = $scope.dataFiltersValues[""];






        $scope.quantity = 100;



        // LOCAL STORAGE 
        var storage = JSON.parse(localStorage.getItem("instructions"));

        if (storage.length) {
            $scope.finalObject = storage;
            return;
        }

        init();

        function init() {

            JSOMService.getSiteUrl().then(function(result) {
                $scope.siteUrl = result;

            });

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
                                    return function(obj) {
                                        var expirty = toJSONLocal(prop);
                                        if (obj[prop] < inNMonths(val)) return true;
                                    }
                                }


                                $scope.expirty = toJSONLocal(existInstruction.ExpiryDate);


                                // if (expirty < inNMonths(1)) {

                                $scope.finalObject.push({
                                    Name: employee.Name !== currentEmployeeName ? employee.Name : '',
                                    _Name: employee.Name,
                                    EmployeeId: employee.Id,
                                    InstructionId: instruction.Id,
                                    Instruction: existInstruction.InstructieName !== currentInstructionName ? existInstruction.InstructieName : '',
                                    CompetenceId: competence.Id,
                                    Competence: competence.Name,
                                    TrainingDate: existInstruction.TrainingDate,
                                    ExpiryDate: existInstruction.ExpiryDate
                                });

                                currentEmployeeName = employee.Name;
                                currentInstructionName = existInstruction.InstructieName;

                                // }



                            })

                        })



                    });

                    localStorage.setItem("instructions", JSON.stringify($scope.finalObject));
                });

            }).catch(function(errorMsg) {
                $scope.error = errorMsg;
            });

        }
    }

     angular.module('app').filter("myfilter", function() {
             // $scope.dataFilters = $scope.dataFiltersValues[""];
            return function(items) {
                
                
                var dt = new Date();
                dt.setMonth(dt.getMonth() + 2);
                var arrayToReturn = [];
                for (var i = 0; i < items.length; i++) {
                    var tt = new Date(items[i].ExpiryDate);
                    // console.log(tt);
                    if (tt < dt) {
                        arrayToReturn.push(items[i]);
                       
                    }
                   
                }

                return arrayToReturn;
            };
        });
})();
