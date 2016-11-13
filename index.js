var express = require('express');
var app = express();
var synchronizer = require('./synchronizer.js');

app.get('/', function(req, res) {
    res.send(synchronizer());
});

app.listen(3000, function() {
    console.log("Server running in port 3000!");
});