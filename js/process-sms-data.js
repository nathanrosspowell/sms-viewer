// process-sms-data.js
"use strict";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// User underscore.
importScripts('../underscore/underscore-min.js');

function log(msg) {
    self.postMessage({"cmd": 'log', "msg" : msg});
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Pass in a JSON doc and fill out all of the data.
function GetDataFromJson(jsonDoc) {
    var names = [];
    var words = [];
    var dates = { "low": null, "high": null };
    var listsms = jsonDoc["smses"]["sms"];
    // Names
    _.each(listsms, function(sms) {
        names.push(sms["_contact_name"]);
        var splits = sms["_body"].split(" ");
        _.each(splits, function(split) {
            words.push( split );
        });
        var date = new Date(sms["_readable_date"]);
        date.setHours(0,0,0,0) 
        if ( date < dates["low"] || dates["low"] === null ) {
            dates["low"] = date;
        }
        if ( date > dates["high"] || dates["high"] === null ) {
            dates["high"] = date;
        }
    });
    names = _.unique( names ); 
    words = _.unique( words ); 
    self.postMessage({
        "cmd" : "SetupFilters",
        "names" : names , 
        "words" : words,
        "dates" : dates
    });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Filter the list before displaying.
function FilterSms(jsonDoc, nameFilters, wordFilters, dateFilters) {
    var listsms = jsonDoc["smses"]["sms"];
    // Make the heavy work time out in a loop.
    var length = listsms.length;
    var index = 0;
    for (; index < length; index++) {
        var sms =  listsms[index];
        // SMS attributes.
        var smsName = sms["_contact_name"];
        var smsBody = sms["_body"];
        var smsDate = sms["_readable_date"];
        // Check if it can be added.
        // Date filter.
        var add = true;
        if ( typeof dateFilters !== 'undefined' ) {
            var date = new Date(smsDate);
            date.setHours(0,0,0,0) 
            console.log( "FilterSms", smsDate, date, dateFilters );
            if ( date < dateFilters["low"] ){
                console.log( "   low" );
                add = false;
            }
            if ( date > dateFilters["high"] ){
                console.log( "   high" );
                add = false;
            }
        }
        if ( add ) {
            // Name filter.
            if ( nameFilters.length > 0 ) {
                add = false;
                _.each( nameFilters, function(name) {
                    if ( name === smsName ) {
                        add = true;
                    }
                });
            }
            if ( add ){
                // Word filter.
                if ( wordFilters.length > 0) {
                    add = false;
                    _.each( wordFilters, function(word) {
                        if ( smsBody.indexOf(word) > -1) {
                            add = true;
                        }
                    });
                }
                // Add a list item.
                if ( add ) {
                    self.postMessage({
                        "cmd": 'AddSms', 
                        "header" : smsName + ": " + sms["_readable_date"],
                        "body" :  sms["_body"],
                        "received" : sms["_type"] == "1"
                    });
                }
            }
        }
        self.postMessage({"cmd" : "progress", "loaded" : index + 1, "total" : length});
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function ChangeData(jsonDoc) {
    GetDataFromJson(jsonDoc);
    FilterSms(jsonDoc, [], [], undefined);
    self.jsonDoc = jsonDoc;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
self.addEventListener('message', function(event) {
    var data = event.data;
    switch (data.cmd) {
        case 'json':
            ChangeData(data.json);
            break;
        case 'filter':
            FilterSms(self.jsonDoc, data.nameFilters, data.wordFilters, data.dateFilters);
            break;
        case 'stop':
            self.postMessage('WORKER STOPPED: ' + data.msg + '. (buttons will no longer work)');
            self.close(); // Terminates the worker.
            break;
        default:
            self.postMessage('Unknown command: ' + data.msg);
    };
}, false)
