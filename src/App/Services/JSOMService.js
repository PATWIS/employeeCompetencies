(function() {
    'use strict';

    // defined JSOM service
    angular.module('app').provider('JSOMService', function() {
        var clientCtx;
        this.$get = ['$q', "$log", function($q, $log) {
            var contextLoaded = $q.defer();
            SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function() {
                clientCtx = SP.ClientContext.get_current();
                contextLoaded.resolve();
            });

            function createServiceForConfiguration() {
                var service = {};
                service.self = service;
                service.clientCtx = clientCtx;

                service.changeContext = function(webUrl) {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {
                        if (webUrl) {
                            clientCtx = new SP.ClientContext(webUrl);
                        } else {
                            clientCtx = SP.ClientContext.get_current();
                        }
                        deferred.resolve();
                    });

                    return deferred.promise;
                }

                service.getCompetences = function(emploteeId) {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                        service.web = clientCtx.get_web();
                        var employeesList = service.web.get_lists().getByTitle('Overzicht Medewerkers');
                        var query = new SP.CamlQuery();

                        query.set_viewXml("<View><Query><Where>\
                                                            <Eq><FieldRef Name='ID'/><Value Type='Counter'>" + emploteeId + "</Value></Eq>\
                                                        </Where></Query></View>");

                        var employees = employeesList.getItems(query);

                        clientCtx.load(employees, 'Include(Title, ID, Competentie)');

                        clientCtx.executeQueryAsync(function(sender, args) {
                            var enumerator = employees.getEnumerator();
                            var result = [];
                            while (enumerator.moveNext()) {

                                var employeesItem = enumerator.get_current();
                                var competencesVals = employeesItem.get_item("Competentie"); //get multi lookup value (SP.FieldLookupValue[])
                          
                                if (competencesVals.length === 0) {
                                    result.push({
                                        Name: ""
                                    });
                                    continue;
                                }
                          
                                for (var i = 0; i < competencesVals.length; i++) {

                                    result.push({
                                        Id: competencesVals[i].get_lookupId(),    
                                        Name: competencesVals[i].get_lookupValue()
                                    });
                                }
                                
                            }
                            deferred.resolve(result);
                        }, function(sender, args) {
                            deferred.reject(args.get_message());
                        });
                    });
                    return deferred.promise;
                };

                service.getInstructions = function(competenceIds) {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                        
                        service.web = clientCtx.get_web();
                        var competencesList = service.web.get_lists().getByTitle('Overzicht Competenties');

                        var query = "<View><Query><Where><In><FieldRef Name='ID'/><Values>";
                                    angular.forEach(competenceIds, function(value, index) {
                                        query = query + "<Value Type='Counter'>" + value + "</Value>";
                                    });
                       
                        query = query + "</Values></In></Where></Query></View>";

                        var camlQuery = new SP.CamlQuery();
                        camlQuery.set_viewXml(query);
                        var competences = competencesList.getItems(camlQuery);

                        clientCtx.load(competences, 'Include(Title, ID, Competentie_x0020_documenten)');

                        clientCtx.executeQueryAsync(function(sender, args) {
                            var enumerator = competences.getEnumerator();
                            var result = [];
                            while (enumerator.moveNext()) {
                                var instructions = [];
                                var competencesItem = enumerator.get_current();
                                var instructionsVals = competencesItem.get_item("Competentie_x0020_documenten"); //get multi lookup value (SP.FieldLookupValue[])

                                if (instructionsVals.length === 0) {
                                    instructions.push({
                                        Name: ""
                                    });
                                }

                                for (var i = 0; i < instructionsVals.length; i++) {

                                    instructions.push({
                                        Id: instructionsVals[i].get_lookupId(),
                                        Name: instructionsVals[i].get_lookupValue()
                                    });
                                }

                                result.push({
                                    Id: competencesItem.get_item("ID"), 
                                    Name: competencesItem.get_item("Title"),
                                    Instructions: instructions
                                })

                            }

                            deferred.resolve(result);



                        }, function(sender, args) {

                            deferred.reject(args.get_message());


                        });
                    });
                    return deferred.promise;
                };

                service.getDates = function(emploteeId) {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                       
                        service.web = clientCtx.get_web();
                        var herhalingData = service.web.get_lists().getByTitle('Instructie Trainingen');

                        var query = new SP.CamlQuery();
                          query.set_viewXml("<View><Query><Where>\
                                                            <Eq><FieldRef Name='Medewerker' LookupId='TRUE'/><Value Type='Lookup'>" + emploteeId + "</Value></Eq>\
                                                        </Where></Query></View>");
                      
                        var instructions = herhalingData.getItems(query);

                        clientCtx.load(instructions, 'Include(Medewerker, Instructie, DatumAftekenen, DatumHerhaling)');

                        clientCtx.executeQueryAsync(function(sender, args) {
                            var enumerator = instructions.getEnumerator();
                            var result = [];
                            while (enumerator.moveNext()) {
                              
                                var herhalingDataItem = enumerator.get_current();
                    

                                result.push({
                                    Id: herhalingDataItem.get_item("Instructie").get_lookupId(),
                                    DatumAftekenen : herhalingDataItem.get_item("DatumAftekenen"),
                                    DatumHerhaling : herhalingDataItem.get_item("DatumHerhaling")
                                })

                            }

                            deferred.resolve(result);

                        }, function(sender, args) {
                            deferred.reject(args.get_message());
                        });
                    });
                    return deferred.promise;
                };








                return service;
            }
            return createServiceForConfiguration();
        }];
    });
})();
