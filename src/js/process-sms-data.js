// process-json.js
"use strict";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// User underscore.
importScripts('../../bower_components/underscore/underscore-min.js');

function log(msg) {
    self.postMessage({"cmd": 'log', "msg" : msg});
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Pass in a JSON doc and fill out all of the data.
function GetDataFromJson(jsonDoc) {
    log( "GetDataFromJson" );
    var names = [];
    var words = [];
    log( "jsonDoc " + JSON.stringify(jsonDoc) );
    var listsms = jsonDoc["smses"]["sms"];
    log( "listsms" + JSON.stringify(listsms) );
    // Names
    _.each(listsms, function(sms) {
        log( "NAMES ---------------  " + JSON.stringify(sms) );
        names.push(sms["@contact_name"]);
    });
    names = _.unique( names ); 
    // Words
    _.each(listsms, function(sms) {
        log( "WORDS --------------- " + JSON.stringify(sms) );
        var splits = sms["@body"].split(" ");
        _.each(splits, function(split) {
            words.push( split );
        });
    });
    words = _.unique( words ); 
    self.postMessage({"cmd" : "SetupFilters", "names" : names , "words" : words });
    return {
        "names" : names, 
        "words" : words
    };
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Filter the list before displaying.
function FilterSms(jsonDoc) {
    self.postMessage({ "cmd": 'ClearSms'});
    log( JSON.stringify(jsonDoc) );
    var listsms = jsonDoc["smses"]["sms"];
    // Make the heavy work time out in a loop.
    var jsonElements = _(jsonDoc).find('Object');
    var length = listsms.length;
    var index = 0;
    for (; index < length; index++) {
        var sms =  listsms[index];
        log( "SMS " + index.toString() + " : " + JSON.stringify(sms) );
        log( "Address: " + sms["@address"] );
        // SMS attributes.
        var smsName = sms["@contact_name"];
        var smsBody = sms["@body"];
        // Check if it can be added.
        var add = true;
        // Name filter.
        var _filterNames = []; /*_('input.filter-name[value!=""]').filter(function () {
            return this.value.length > 0
        });*/
        if ( _filterNames.length > 0 ) {
            console.log( "filterNames " + _filterNames.length );
            add = false;
            _filterNames.each(function() {
                var name = _(this).val();
                console.log( "name " + name + " = '" + smsName + "'");
                if ( name === smsName ) {
                    add = true;
                    console.log( "add");
                }
            });
        }
        if ( add ){
            // Date filter.
            // Todo....
            // Word filter.
            var _filterWords = []; /* _('input.filter-word[value!=""]').filter(function () {
                return this.value.length > 0
            });*/
            if ( _filterWords.length > 0) {
                console.log( "filterWords " + _filterWords.length );
                add = false;
                _filterWords.each(function() {
                    var word = _(this).val();
                    console.log( "word '" + word + "' = '" + smsBody + "'");
                    if ( smsBody.indexOf(word) > -1) {
                        add = true;
                        console.log( "add");
                    }
                });
            }
            // Add a list item.
            if ( add ) {
                self.postMessage({
                    "cmd": 'AddSms', 
                    "header" : smsName + ": " + sms["@readable_date"],
                    "body" :  sms["@body"]
                });
            }
        }
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function ChangeData(jsonDoc) {
    GetDataFromJson(jsonDoc);
    FilterSms(jsonDoc);
    self.jsonDoc = jsonDoc;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
self.addEventListener('message', function(event) {
    var data = event.data;
    switch (data.cmd) {
        case 'json':
            log( "json" );
            ChangeData(data.json);
            break;
        case 'filter':
            FilterSms(self.jsonDoc);
            break;
        case 'stop':
            self.postMessage('WORKER STOPPED: ' + data.msg + '. (buttons will no longer work)');
            self.close(); // Terminates the worker.
            break;
        default:
            self.postMessage('Unknown command: ' + data.msg);
    };
}, false)
