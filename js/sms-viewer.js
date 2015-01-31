// sms-viewer.js
//
// Thanks go to:
//     http://www.html5rocks.com/en/tutorials/file/dndfiles/ 
(function(){
	"use strict";
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //  Globals.
    var xmlWorker = undefined;
    var reader = undefined;
    var progress = document.querySelector('.percent');

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function HandleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files; // FileList object.
        for (var i = 0, f; f = files[i]; i++) {
            reader = new FileReader();
            reader.onerror = errorHandler;
            reader.onprogress = updateProgress;
            reader.onabort = function(e) {
                alert('File read cancelled');
            };
            reader.onloadstart = function(e) {
                document.getElementById('progress_bar').className = 'loading';
            };
            reader.onload = function(e) {
                progress.style.width = '100%';
                progress.textContent = '100%';
                var rawData = reader.result;
                var xmlDoc = jQuery.parseXML(rawData);
                if (xmlDoc) {
                    ChangeXml(xmlDoc);
                    $('#add-files').slideToggle('slow');
                }
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

    function updateProgress(evt) {
        // evt is an ProgressEvent.
        if (evt.lengthComputable) {
            var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
            // Increase the progress bar length.
            if (percentLoaded < 100) {
                progress.style.width = percentLoaded + '%';
                progress.textContent = percentLoaded + '%';
            }
        }
    }

    function abortRead() {
        if ( reader !== undefined ) {
            reader.abort();
        }
    }

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

    function HandleWorkerUpdate(event) {
        alert( event.data );
    }



    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Set up the page
    // jQuery UI setup.
    $( "#projects" ).accordion();
    $( "#datepicker-from" ).datepicker();
    $( "#datepicker-until" ).datepicker();
    $( "#sortable-sms" ).sortable({
        placeholder: "ui-state-highlight"
    });
    $( "#sortable-sms" ).disableSelection();
    // Loading bars.
    var progressbar = $( "#progressbar" ),
        progressLabel = $( ".progress-label" );
    progressbar.progressbar({
        value: false,
        change: function() {
            progressLabel.text( progressbar.progressbar( "value" ) + "%" );
        },
        complete: function() {
            progressLabel.text( "Complete!" );
        }
    }); 
    // Setup the files listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', HandleDragOver, false);
    dropZone.addEventListener('drop', HandleFileSelect, false);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Test xml. 
    var testXml = '<?xml version="1.0" encoding="utf-8"?><smses count="983"><sms protocol="0" address="+10000000012" date="1383084883788" type="1" subject="null" body="Still at work?" toa="null" sc_toa="null" service_center="+10000000001" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-10-29 6:14:43 PM" contact_name="Kevin" /><sms protocol="0" address="+10000000012" date="1383085269741" type="2" subject="null" body="Nah,  work is for chumps! " toa="null" sc_toa="null" service_center="null" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-10-29 6:21:09 PM" contact_name="Kevin" /> <sms protocol="0" address="+10000000054" date="1383344146838" type="2" subject="null" body="In waverly? " toa="null" sc_toa="null" service_center="null" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-11-01 6:15:46 PM" contact_name="Alex" /> <sms protocol="0" address="+10000000054" date="1383344334491" type="1" subject="null" body="Heading in 5 mins :)" toa="null" sc_toa="null" service_center="+10000000001" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-11-01 6:18:54 PM" contact_name="Alex" /></smses>';
    var xmlDoc = jQuery.parseXML(testXml);
    
    if(typeof(Worker) !== "undefined") {
        if(typeof(w) == "undefined") {
            xmlWorker = new Worker("js/process-xml.js");
            xmlWorker.onmessage = HandleWorkerUpdate;
            xmlWorker.postMessage({ "cmd" : 'start', "msg" : "ello urld."});
        }
    } else {
        if (xmlDoc) {
            ChangeXml(xmlDoc);
        }
    }
})();
