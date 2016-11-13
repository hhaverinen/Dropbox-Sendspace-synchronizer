var Dropbox = require('dropbox');
var request = require('request');
var xml2js = require('xml2js');

var db_key = '3a30dgfp45ufpmh';
var db_secret = '2hy2qujs4vdnxr4';
var db_accesstoken = '8bL7cF9QDZAAAAAAAAAACchf4Ih1b_lcB_dVSnSUpcsZLmao1IU-FCXSjbK8bvi0'; //TODO: get this with OAUTH
var ss_key = 'LN5IKXSIF8';

var dbx = new Dropbox({ accessToken: db_accesstoken });


// gets all the files from dropbox recursively
var listFiles = function(dbx, cursor) {
    if (!cursor) {
        dbx.filesListFolder({ path: '', recursive: true })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);                    
                });
                if (response.has_more) {
                    listFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    } else {
        dbx.filesListFolderContinue({ cursor: cursor })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);                    
                });
                if (response.has_more) {
                    listFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    }
}

var getSendspaceSessionkey = function() {
    var token;
    request('http://api.sendspace.com/rest/?method=auth.createtoken&api_key=LN5IKXSIF8&api_version=1.2', function(error, response, body) {
        var parser = new xml2js.Parser();
        
        parser.parseString(body, function(err, result) {
            token = result.result.token[0];
            console.log(token);
        });
    });
}

module.exports = function() {
    //listFiles(dbx);
    getSendspaceSessionkey();
    
    return "Terve mualima!";
}