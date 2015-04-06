[`sms-viewer`][website]
========================

Some code to open and view text message backup files for easier browsing.

Dev Install
===========

    apt-get install -y nodejs
    npm install -g grunt-cli bower
    npm install
    bower install
    grunt server

XML Data
========

On Android there are 'SMS backup' apps which dump out an XML file.
Trying to find a certain message with `CTRL+F` is not very efficient. 

Features
========

* Quick loading of XML file - due to using HTML5 Web Workers
* Filtering on:
    - names of sender / reviever
    - words in the SMS body

To Do
=====

* Search a sub set of the data, as many times as needed
* Add modifiers to filters
    - Is / Is not
    - Regex expressions
* Improve UI

[website]: http://nathanrosspowell.github.io/sms-viewer
