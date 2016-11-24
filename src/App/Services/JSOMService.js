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
                };


                service.getSiteUrl = function() {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {
                        var ctx = new SP.ClientContext();
                        var site = ctx.get_site();
                        ctx.load(site);
                        ctx.executeQueryAsync(function(s, a) {

                            var result = site.get_url();
                            deferred.resolve(result);
                        });


                    });

                    return deferred.promise;
                };



                service.getEmployees = function() {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                        service.web = clientCtx.get_web();
                        var employeesList = service.web.get_lists().getByTitle('Overzicht Medewerkers');


                        var query = new SP.CamlQuery();

                        var employees = employeesList.getItems(query);

                        clientCtx.load(employees, 'Include(Title, ID, Competentie)');

                        clientCtx.executeQueryAsync(function(sender, args) {
                            var enumerator = employees.getEnumerator();
                            var result = [];

                            while (enumerator.moveNext()) {
                                var competences = [];
                                var employeesItem = enumerator.get_current();
                                var competencesVals = employeesItem.get_item("Competentie"); //get multi lookup value (SP.FieldLookupValue[])

                                if (competencesVals.length !== 0) {

                                    for (var i = 0; i < competencesVals.length; i++) {

                                        competences.push({
                                            Id: competencesVals[i].get_lookupId()
                                        });
                                    }

                                    result.push({
                                        Id: employeesItem.get_item('ID'),
                                        Name: employeesItem.get_item('Title'),
                                        Competences: competences
                                    })
                                }
                            }
                            localStorage.setItem("employees", JSON.stringify(result));
                            deferred.resolve(result);
                        }, function(sender, args) {
                            deferred.reject(args.get_message());
                        });
                    });
                    return deferred.promise;
                };

                service.getEmployeeCompetences = function(emploteeId) {
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

                service.getCompetenceInstructions = function(competenceIds) {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                        service.web = clientCtx.get_web();

                        var list = service.web.get_lists().getByTitle('Overzicht Competenties');
                        var listRootFolder = list.get_rootFolder();
                        clientCtx.load(listRootFolder);

                        var query = "<View><Query><Where><In><FieldRef Name='ID'/><Values>";
                        angular.forEach(competenceIds, function(value, index) {
                            query = query + "<Value Type='Counter'>" + value + "</Value>";
                        });

                        query = query + "</Values></In></Where></Query></View>";

                        var camlQuery = new SP.CamlQuery();
                        camlQuery.set_viewXml(query);
                        var competences = list.getItems(camlQuery);

                        clientCtx.load(competences, 'Include(Title, ID, Competentie_x0020_documenten)');

                        clientCtx.executeQueryAsync(function(sender, args) {

                            var listURL = listRootFolder.get_serverRelativeUrl();
                            console.log(listURL);



                            var enumerator = competences.getEnumerator();
                            var result = [];
                            while (enumerator.moveNext()) {
                                var instructions = [];
                                var competencesItem = enumerator.get_current();
                                var instructionsVals = competencesItem.get_item("Competentie_x0020_documenten");

                                // var fullUrl = competencesItem.ParentList.ParentWeb.Site.MakeFullUrl(competencesItem.ParentList.DefaultDisplayFormUrl);

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

                service.getCompetences = function() {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                        service.web = clientCtx.get_web();
                        var list = service.web.get_lists().getByTitle('Overzicht Competenties');
                        var camlQuery = new SP.CamlQuery();
                        var competences = list.getItems(camlQuery);

                        clientCtx.load(competences, 'Include(Title, ID, Competentie_x0020_documenten)');

                        clientCtx.executeQueryAsync(function(sender, args) {

                            var enumerator = competences.getEnumerator();
                            var result = [];
                            while (enumerator.moveNext()) {
                                var instructions = [];
                                var competencesItem = enumerator.get_current();
                                var instructionsVals = competencesItem.get_item("Competentie_x0020_documenten");

                                if (instructionsVals.length !== 0) {

                                    for (var i = 0; i < instructionsVals.length; i++) {

                                        instructions.push({
                                            Id: instructionsVals[i].get_lookupId()
                                        });
                                    }

                                    result.push({
                                        Id: competencesItem.get_item("ID"),
                                        Name: competencesItem.get_item("Title"),
                                        Instructions: instructions
                                    })

                                }

                            }

                            deferred.resolve(result);

                        }, function(sender, args) {

                            deferred.reject(args.get_message());

                        });
                    });
                    return deferred.promise;
                };


                service.getInstructionCategory = function(Id) {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                        service.web = clientCtx.get_web();
                        var instructionsList = service.web.get_lists().getByTitle('Productie instructies documenten');
                        var listItem = instructionsList.getItemById(Id);

                        clientCtx.load(listItem);

                        clientCtx.executeQueryAsync(function(sender, args) {

                            var result = {};
                            result.Id = listItem.get_item("ID");
                            result.Category = listItem.get_item("Categorie");

                            // localStorage.setItem("instructions", JSON.stringify(result));
                            // LOCAL STORAGE 
                            // var storedInstructions = JSON.parse(localStorage.getItem("instructions"));
                            // console.log(storedInstructions)
                            deferred.resolve(result);

                        }, function(sender, args) {
                            // alert('Request failed. \nError: ' + args.get_message() + '\nStackTrace: ' + args.get_stackTrace());
                            deferred.reject(args.get_message());

                        });
                    });
                    return deferred.promise;
                };

                service.getHerhalingData = function() {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {
                        var listTitle = 'Instructie Trainingen';
                        var viewTitle = 'Expire for 3 months';

                        function getItemsFromView(listTitle, viewTitle) {

                            var context = new SP.ClientContext.get_current();
                            var list = context.get_web().get_lists().getByTitle(listTitle);
                            var view = list.get_views().getByTitle(viewTitle);
                            context.load(view);

                            context.executeQueryAsync(
                                function(sender, args) { getItemsFromList(listTitle, "<View><RowLimit>5000</RowLimit><Query>" + view.get_viewQuery() + "</Query></View>") },
                                function(sender, args) { alert("error: " + args.get_message()); }
                            );
                        }

                        function getItemsFromList(listTitle, queryText) {
                            var context = new SP.ClientContext.get_current();
                            var list = context.get_web().get_lists().getByTitle(listTitle);

                            var itemPosition = null;
                            var result = [];

                            var getListItemsByListItemCollection = function() {

                                var camlQuery = new SP.CamlQuery();

                                camlQuery.set_listItemCollectionPosition(itemPosition);
                                // var query = "<View><RowLimit>5000</RowLimit></View>";
                                camlQuery.set_viewXml(queryText);

                                var instructions = list.getItems(camlQuery);

                                clientCtx.load(instructions);

                                clientCtx.executeQueryAsync(function(sender, args) {
                                    var enumerator = instructions.getEnumerator();

                                    while (enumerator.moveNext()) {

                                        var herhalingDataItem = enumerator.get_current();

                                        result.push({

                                            MedewerkerId: herhalingDataItem.get_item("Medewerker").get_lookupId(),
                                            InstructieId: herhalingDataItem.get_item("Instructie").get_lookupId(),
                                            InstructieName: herhalingDataItem.get_item("Instructie_x003a_Documentnummer").get_lookupValue(),
                                            TrainingDate: herhalingDataItem.get_item("DatumAftekenen"),
                                            ExpiryDate: herhalingDataItem.get_item("DatumHerhaling")
                                        })

                                    }

                                    itemPosition = instructions.get_listItemCollectionPosition();

                                    console.log(itemPosition);

                                    if (itemPosition != null) {
                                        getListItemsByListItemCollection();
                                    } else {
                                        deferred.resolve(result);
                                    }

                                }, function(sender, args) {
                                    deferred.reject(args.get_message());
                                });

                            }

                            getListItemsByListItemCollection();

                        }


                        getItemsFromView(listTitle, viewTitle);


                    });
                    return deferred.promise;
                };

                service.getInstructionDates = function(emploteeId) {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {


                        service.web = clientCtx.get_web();
                        var herhalingData = service.web.get_lists().getByTitle('Instructie Trainingen');

                        var query = new SP.CamlQuery();
                        query.set_viewXml("<View><Query><Where>\
                                                            <Eq><FieldRef Name='Medewerker' LookupId='TRUE'/><Value Type='Lookup'>" + emploteeId + "</Value></Eq>\
                                                        </Where></Query></View>");

                        var instructions = herhalingData.getItems(query);

                        clientCtx.load(instructions, 'Include(ID, Instructie, DatumAftekenen, DatumHerhaling)');

                        clientCtx.executeQueryAsync(function(sender, args) {
                            var enumerator = instructions.getEnumerator();
                            var result = [];
                            while (enumerator.moveNext()) {

                                var herhalingDataItem = enumerator.get_current();


                                result.push({
                                    ItemId: herhalingDataItem.get_item("ID"),
                                    InstructieId: herhalingDataItem.get_item("Instructie").get_lookupId(),
                                    TrainingDate: herhalingDataItem.get_item("DatumAftekenen"),
                                    ExpiryDate: herhalingDataItem.get_item("DatumHerhaling")
                                })

                            }

                            deferred.resolve(result);

                        }, function(sender, args) {
                            deferred.reject(args.get_message());
                        });
                    });
                    return deferred.promise;
                };

                service.getEmployeeInstructions = function() {
                    var deferred = $q.defer();
                    contextLoaded.promise.then(function() {

                        service.web = clientCtx.get_web();
                        var employeeInstructionsList = service.web.get_lists().getByTitle('Instructie Trainingen');

                        var camlQuery = new SP.CamlQuery();

                        var employeeInstructions = employeeInstructionsList.getItems(camlQuery);

                        clientCtx.load(employeeInstructions, 'Include(Medewerker, Instructie, Instructie_x003a_Documentnummer, DatumAftekenen, DatumHerhaling)');

                        clientCtx.executeQueryAsync(function(sender, args) {
                            var enumerator = employeeInstructions.getEnumerator();
                            var result = [];
                            while (enumerator.moveNext()) {
                                var employeeInstructionsItem = enumerator.get_current();

                                result.push({
                                    IdEmployee: employeeInstructionsItem.get_item('Medewerker').get_lookupId(),
                                    Id: employeeInstructionsItem.get_item("Instructie"),
                                    Name: employeeInstructionsItem.get_item("Instructie_x003a_Documentnummer").get_lookupValue()
                                })

                            }

                            deferred.resolve(result);

                        }, function(sender, args) {

                            deferred.reject(args.get_message());

                        });
                    });
                    return deferred.promise;
                };


                service.saveChanges = function(editDataItem, employeeId) {
                    var deferred = $q.defer();

                    contextLoaded.promise.then(function() {
                        service.web = clientCtx.get_web();

                        var list = service.web.get_lists().getByTitle('Instructie Trainingen');
                        
                    
                        
                        if (editDataItem.ItemId) {
                            var listItem = list.getItemById(editDataItem.ItemId);
                            listItem.set_item("DatumAftekenen", editDataItem.TrainingDate);
                            listItem.set_item("DatumHerhaling", editDataItem.ExpiryDate);
                            listItem.update();

                            clientCtx.executeQueryAsync(function onQuerySucceeded() {
                                alert('Item updated!');
                                deferred.resolve();
                            }, function onQueryFailed(sender, args) {

                                alert('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
                                deferred.reject();
                            });


                        } else {

                            var itemCreateInfo = new SP.ListItemCreationInformation();
                            var newItem = list.addItem(itemCreateInfo);

                            var employeeLookupValue = new SP.FieldLookupValue();
                            employeeLookupValue.set_lookupId(employeeId);

                            var instructieLookupValue = new SP.FieldLookupValue();
                            instructieLookupValue.set_lookupId(editDataItem.Id);

                            newItem.set_item("Medewerker", employeeLookupValue);
                            newItem.set_item("Instructie", instructieLookupValue);
                            newItem.set_item("DatumAftekenen", editDataItem.TrainingDate);
                            newItem.set_item("DatumHerhaling", editDataItem.ExpiryDate);
                            
                            newItem.update();
                            clientCtx.load(list);

                            clientCtx.executeQueryAsync(function onQuerySucceeded() {
                                alert('Item created: ' + newItem.get_id());
                                deferred.resolve();
                            }, function onQueryFailed(sender, args) {
                                alert('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
                                deferred.reject();
                            });
                            

                        }


                    });

                    return deferred.promise;

                };








                return service;
            }
            return createServiceForConfiguration();
        }];
    });
})();
