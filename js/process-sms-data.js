// process-json.js
"use strict";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// User underscore.
importScripts("json2json.js");
importScripts("marknote.js");
importScripts('../underscore/underscore-min.js');

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Pass in a JSON doc and fill out all of the data.
function GetDataFromJson(jsonDoc) {
    console.log(JSON.stringify(jsonDoc));
    var names = [];
    var words = [];
    var $json = $( jsonDoc );
    var listsms = $json.find( "sms" );
    // Names
    $.each(listsms, function(i) {
        var $sms = $( this );
        names.push($sms.attr("contact_name"));
    });
    names = jQuery.unique( names ); 
    $( "#names" ).autocomplete({
        source: names
    });
    // Words
    $.each(listsms, function(i) {
        var $sms = $( this );
        var splits = $sms.attr("body").split(" ");
        $.each(splits, function(j) {
            words.push( splits[j] );
        });
    });
    words = jQuery.unique( words ); 
    $( "#words" ).autocomplete({
        source: words
    });
    FilterSms(jsonDoc);
    return {
        "names" : names, 
        "words" : words
    };
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Filter the list before displaying.
function FilterSms(jsonDoc) {
    self.postMessage({ "cmd": 'alert', "msg" : 'Filtering' });
    var $json = $(jsonDoc);
    var listsms = $json.find( "sms" );
    var smsList = $('#sortable-sms');
    smsList.empty(); 
    // Make the heavy work time out in a loop.
    var jsonElements = $(jsonDoc).find('Object');
    var length = listsms.length;
    var index = 0;
    for (; index < length; index++) {
        var $sms = $( listsms[index] );
        // SMS attributes.
        var smsName = $sms.attr("contact_name");
        var smsBody = $sms.attr("body");
        // Check if it can be added.
        var add = true;
        // Name filter.
        var $filterNames = $('input.filter-name[value!=""]').filter(function () {
            return this.value.length > 0
        });
        if ( $filterNames.length > 0 ) {
            console.log( "filterNames " + $filterNames.length );
            add = false;
            $filterNames.each(function() {
                var name = $(this).val();
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
            var $filterWords = $('input.filter-word[value!=""]').filter(function () {
                return this.value.length > 0
            });
            if ( $filterWords.length > 0) {
                console.log( "filterWords " + $filterWords.length );
                add = false;
                $filterWords.each(function() {
                    var word = $(this).val();
                    console.log( "word '" + word + "' = '" + smsBody + "'");
                    if ( smsBody.indexOf(word) > -1) {
                        add = true;
                        console.log( "add");
                    }
                });
            }
            // Add a list item.
            if ( add ) {
                var li = $('<li/>')
                    .addClass('ui-state-default')
                    .appendTo(smsList);
                var name = $('<h4/>')
                    .text(smsName + ": " + $sms.attr("readable_date"))
                    .appendTo(li);
                var body = $('<p/>')
                    .text($sms.attr("body"))
                    .appendTo(li);
            }
        }
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function ChangeData(jsonDoc) {
    var details = GetDataFromJson(jsonDoc);
    SetupFilters(details["names"], details["words"]); 
    FilterSms(jsonDoc);
    $(".update-sms").click(function () {
        ChangeData(jsonDoc);
    });
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
self.addEventListener('message', function(event) {
  var data = event.data;
  switch (data.cmd) {
    case 'json':
      ChangeData(data.json);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg + '. (buttons will no longer work)');
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false)