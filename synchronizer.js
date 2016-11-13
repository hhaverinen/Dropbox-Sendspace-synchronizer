var Dropbox = require('dropbox');

var db_key = '3a30dgfp45ufpmh';
var db_secret = '2hy2qujs4vdnxr4';
var db_accesstoken = '8bL7cF9QDZAAAAAAAAAACchf4Ih1b_lcB_dVSnSUpcsZLmao1IU-FCXSjbK8bvi0'; //TODO: get this with OAUTH

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

module.exports = function() {
    listFiles(dbx);
    
    return "Terve mualima!";
}