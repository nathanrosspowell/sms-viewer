// sms-viewer.js
// Thanks go to:
//     http://www.html5rocks.com/en/tutorials/file/dndfiles/
(function(){
	"use strict";
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function HandleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        ClearAll();
        var files = evt.dataTransfer.files; // FileList object.
        for (var i = 0, f; f = files[i]; i++) {
            reader = new FileReader();
            reader.onerror = errorHandler;
            reader.onprogress = updateProgress;
            reader.onabort = function(e) {
                alert('File read cancelled');
            };
            reader.onload = function(e) {
                progressbar.progressbar( "value", 100  );
                var rawData = reader.result;
                NewSmsData(rawData);
            }
            reader.readAsText(f);
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function HandleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function updateProgress(evt) {
        if (evt.lengthComputable) {
            var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
            progressbar.progressbar( "value", percentLoaded  );
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function abortRead() {
        if ( reader !== undefined ) {
            reader.abort();
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function errorHandler(evt) {
        switch(evt.target.error.code) {
        case evt.target.error.NOT_FOUND_ERR:
            alert('File Not Found!');
            break;
        case evt.target.error.NOT_READABLE_ERR:
            alert('File is not readable');
            break;
        case evt.target.error.ABORT_ERR:
            break; // noop
        default:
            alert('An error occurred reading this file.');
        };
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function HandleWorkerUpdate(event) {
        var data = event.data;
        console.log( "HandleWorkerUpdate: " + JSON.stringify(data));
        switch (data.cmd) {
            case 'SetupFilters':
                SetupFilters( data.names, data.words, data.dates );
                break;
            case 'AddSms':
                var smsList = $('#sortable-sms');
                var li = $('<li/>')
                    .addClass('ui-state-default')
                    .addClass(data.received ? "sms-received" : "sms-sent" )
                    .appendTo(smsList);
                var div = $('<div/>')
                    .addClass(data.received ? "sms-received" : "sms-sent" )
                    .appendTo(li);
                var name = $('<h4/>')
                    .text((data.received ? "From" : "To") + " " + data.header)
                    .appendTo(div);
                var body = $('<p/>')
                    .text(data.body)
                    .appendTo(div);
                break;
            case 'progress':
                var percentLoaded = Math.round((data.loaded / data.total) * 100);
                progressbar.progressbar( "value", percentLoaded  );
                break;
            default:
                break;
        }
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Set up filters.
    function SetupFilters(names, words, dates) {
        if (typeof names === 'undefined') {
            names = []
        }
        if (typeof words === 'undefined') {
            names = []
        }
        nameAutocomplete = jQuery.unique(nameAutocomplete.concat(names));
        wordAutocomplete = jQuery.unique(wordAutocomplete.concat(words));
        if (typeof dates !== 'undefined') {
            dateRange = dates;
        }
        $("input.filter-name").each(function() {
            $(this).autocomplete({
                source: nameAutocomplete
            });
        });
        $("input.filter-word").each(function() {
            $(this).autocomplete({
                source: wordAutocomplete
            });
        });
        // The data picker.
        $( "#from" ).datepicker({
            minDate: dateRange["low"],
            maxDate: dateRange["high"],
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 2,
            onClose: function( selectedDate ) {
                $( "#to" ).datepicker( "option", "minDate", selectedDate );
            }
        }).datepicker( "setDate", dateRange["low"] );
        $( "#to" ).datepicker({
            minDate: dateRange["low"],
            maxDate: dateRange["high"],
            defaultDate: "+1w",
            changeMonth: true,
            numberOfMonths: 2,
            onClose: function( selectedDate ) {
                $( "#from" ).datepicker( "option", "maxDate", selectedDate );
            }
        }).datepicker( "setDate", dateRange["high"] );
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function ClearAll() {
        ClearSms();
        nameAutocomplete = [];
        wordAutocomplete = [];
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function ClearSms() {
        $('#sortable-sms').empty();
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function UpdateFilters() {
        ClearSms();
        var nameFilters = [];
        var wordFilters = [];
        var dateFilter = undefined;
        $('input.filter-name').val(function( index, value ) {
            if ( value !== "" ) {
                nameFilters.push( value );
            }
            return value;
        });
        $('input.filter-word[value!=""]').val(function( index, value ) {
            if ( value !== "" ) {
                wordFilters.push( value );
            }
            return value;
        });
        var fromDate = $('#from').val();
        var toDate = $('#to').val();
        if ( fromDate !== '' && toDate !== '' ) {
            var low = new Date(fromDate);
            var high = new Date(toDate);
            low.setHours(0,0,0,0)
            high.setHours(0,0,0,0);
            dateFilter = { 
                "low" : low,
                "high" : high
            };
        }
        dataWorker.postMessage({
            "cmd" : 'filter',
            "nameFilters" : nameFilters,
            "wordFilters": wordFilters,
            "dateFilters": dateFilter
        });
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function NewSmsData(xmlString) {
        if(typeof(Worker) !== "undefined") {
            if(typeof(w) == "undefined") {
                dataWorker = new Worker("js/process-sms-data.js");
                dataWorker.onmessage = HandleWorkerUpdate;
            }
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(xmlString);
            console.log( JSON.stringify( jsonData) );
            dataWorker.postMessage({ "cmd" : 'json', "json" : jsonData});
        } else {
            var xmlDoc = jQuery.parseXML(xmlString);
            if (xmlDoc) {
                ChangeXml(xmlDoc);
            }
        }
    }

    function SetupFilterCreation(name) {
        $( "button.remove-filter-"+name ).click(function() {
            $( this ).closest("div").remove();
        });
        $( "button.add-filter-"+name ).click(function() {
            var extras = $( "#extra-filter-"+name);
            var div = $('<div/>').appendTo(extras);
            $('<input/>')
                .addClass('filter-'+name)
                .appendTo(div);
            $('<button/>')
                .addClass('remove-filter-'+name)
                .text("Remove")
                .appendTo(div)
                .click(function() {
                    $( this ).closest("div").remove();
                });
            SetupFilters();
        });
    }

    function SetupDatePickerCreation() {
        $( "button.remove-filter-date" ).click(function() {
            $( this ).closest("div").remove();
        });
        $( "button.add-filter-date" ).click(function() {
            var extras = $( "#extra-filter-date");
            var div = $('<div/>').appendTo(extras);
            $('<input/>')
                .addClass('filter-date')
                .appendTo(div);
            $('<button/>')
                .addClass('remove-filter-date')
                .text("Remove")
                .appendTo(div)
                .click(function() {
                    $( this ).closest("div").remove();
                });
            SetupFilters();
        });
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //  Globals.
    var dataWorker = undefined;
    var reader = undefined;
    var nameAutocomplete = [];
    var wordAutocomplete = [];
    var dateRange = undefined;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Set up the page.
    $.datepicker.setDefaults({ dateFormat: 'dd MM yy' });
    // jQuery UI setup.
    $( "#projects" ).accordion();
    $( "#sortable-sms" ).sortable({
        placeholder: "ui-state-highlight"
    });
    $( "#sortable-sms" ).disableSelection();
    // Loading bars.
    var progressbar = $( "#progressbar" );
    var progressLabel = $( ".progress-label" );
    progressbar.progressbar({
        value: false,
        change: function() {
            progressLabel.text( progressbar.progressbar( "value" ) + "%" );
        },
        complete: function() {
            progressLabel.text( "Complete!" );
        }
    });
    // The 'remove' buttons functionality.
    SetupFilterCreation("name");
    SetupFilterCreation("word");
    // Setup the files listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', HandleDragOver, false);
    dropZone.addEventListener('drop', HandleFileSelect, false);
    $(".update-sms").click(UpdateFilters);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Test xml.
    var xmlString = '<?xml version="1.0" encoding="utf-8"?><smses count="983"><sms protocol="0" address="+10000000012" date="1383084883788" type="1" subject="null" body="Still at work?" toa="null" sc_toa="null" service_center="+10000000001" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-10-29 6:14:43 PM" contact_name="Kevin" /><sms protocol="0" address="+10000000012" date="1383085269741" type="2" subject="null" body="Nah,  work is for chumps! " toa="null" sc_toa="null" service_center="null" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-10-29 6:21:09 PM" contact_name="Kevin" /> <sms protocol="0" address="+10000000054" date="1383344146838" type="2" subject="null" body="In waverly? " toa="null" sc_toa="null" service_center="null" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-11-01 6:15:46 PM" contact_name="Alex" /> <sms protocol="0" address="+10000000054" date="1383344334491" type="1" subject="null" body="Heading in 5 mins :)" toa="null" sc_toa="null" service_center="+10000000001" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-11-01 6:18:54 PM" contact_name="Alex" /></smses>';
    NewSmsData(xmlString);
})();
