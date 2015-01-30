(function(){
	"use strict";
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Pass in a JSON doc and fill out all of the data.
    function GetDataFromJson(xmlDoc) {
        var names = [];
        var words = [];
        var $xml = $( xmlDoc );
        var listsms = $xml.find( "sms" );
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
        FilterSms(xmlDoc);
        return {
            "names" : names, 
            "words" : words
        };
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Set up filters.
    function SetupFilters(names, words) {
        $("input.filter-name").each(function() {
            $(this).autocomplete({
                source: names
            });
        });
        $("input.filter-word").each(function() {
            $(this).autocomplete({
                source: words
            });
        });
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Filter the list before displaying.
    function FilterSms(xmlDoc) {
        var $xml = $(xmlDoc);
        var listsms = $xml.find( "sms" );
        // SMS
        var smsList = $('#sortable-sms');
        smsList.empty(); 
        $.each(listsms, function(i) {
            var $sms = $( this );
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
        });
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function ChangeXml(xmlDoc) {
        var details = GetDataFromJson(xmlDoc);
        SetupFilters(details["names"], details["words"]); 
        FilterSms(xmlDoc);
        $(".update-sms").click(function () {
            ChangeXml(xmlDoc);
        });
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function HandleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files; // FileList object.
        for (var i = 0, f; f = files[i]; i++) {
            var reader = new FileReader();
            reader.onload = function(e) {
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

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Set up the page
    // Setup the dnd listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', HandleDragOver, false);
    dropZone.addEventListener('drop', HandleFileSelect, false);
    // jQuery UI setup.
    $( "#projects" ).accordion();
    $( "#datepicker-from" ).datepicker();
    $( "#datepicker-until" ).datepicker();
    $( "#sortable-sms" ).sortable({
        placeholder: "ui-state-highlight"
    });
    $( "#sortable-sms" ).disableSelection();

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Test xml. 
    var testXml = '<?xml version="1.0" encoding="utf-8"?><smses count="983"><sms protocol="0" address="+10000000012" date="1383084883788" type="1" subject="null" body="Still at work?" toa="null" sc_toa="null" service_center="+10000000001" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-10-29 6:14:43 PM" contact_name="Kevin" /><sms protocol="0" address="+10000000012" date="1383085269741" type="2" subject="null" body="Nah,  work is for chumps! " toa="null" sc_toa="null" service_center="null" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-10-29 6:21:09 PM" contact_name="Kevin" /> <sms protocol="0" address="+10000000054" date="1383344146838" type="2" subject="null" body="In waverly? " toa="null" sc_toa="null" service_center="null" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-11-01 6:15:46 PM" contact_name="Alex" /> <sms protocol="0" address="+10000000054" date="1383344334491" type="1" subject="null" body="Heading in 5 mins :)" toa="null" sc_toa="null" service_center="+10000000001" read="1" status="-1" locked="0" date_sent="0" readable_date="2013-11-01 6:18:54 PM" contact_name="Alex" /></smses>';
    var xmlDoc = jQuery.parseXML(testXml);
    if (xmlDoc) {
        ChangeXml(xmlDoc);
    }
})();
