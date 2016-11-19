var Dropbox = require('dropbox');
var SendSpace = require('./SendSpace');
var request = require('request');
var xml2js = require('xml2js');
var md5 = require('md5');

var db_key = '3a30dgfp45ufpmh';
var db_secret = '2hy2qujs4vdnxr4';
var db_accesstoken = '8bL7cF9QDZAAAAAAAAAACchf4Ih1b_lcB_dVSnSUpcsZLmao1IU-FCXSjbK8bvi0'; //TODO: get this with OAUTH
var ss_key = 'LN5IKXSIF8';

var dbx = new Dropbox({ accessToken: db_accesstoken });
var ss = new SendSpace({ user: 'henrin.testailu@gmail.com', password: '', apiKey: ss_key });


// gets all the files from dropbox recursively
var listDropBoxFiles = function(dbx, cursor) {
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

var listSendSpaceFiles = function(session_key) {
    request('http://api.sendspace.com/rest/?method=folders.getcontents&session_key='+session_key+'&folder_id=0', function(error, response, body) {
        console.log(body);
    });
}

var getDropBoxDownloadParams = function(filepath, authToken) {
    return {
        url: 'https://content.dropboxapi.com/2/files/download',
        headers: {
            'Dropbox-API-Arg': '{"path": "'+filepath+'"}',
            'Authorization': 'Bearer '+authToken
        }
    }
}

module.exports = function() {
    //listDropBoxFiles(dbx);
    //getSendspaceSessionkey(uploadFileToSendSpace);
    /*
    var options = {
        url: 'https://content.dropboxapi.com/2/files/download',
        headers: {
            'Dropbox-API-Arg': '{"path": "/testi1.txt"}',
            'Authorization': 'Bearer 8bL7cF9QDZAAAAAAAAAACchf4Ih1b_lcB_dVSnSUpcsZLmao1IU-FCXSjbK8bvi0'
        }
    };
    
    ss.uploadFileToSendSpace('kissakala.txt', request.get(getDropBoxDownloadParams("/testi1.txt", db_accesstoken)));
    
    */
    
    
    ss.getSessionkey().then(function(response) {
	console.log('SUCCESS!');
        console.log(response);
    }).catch(function(error){
	console.log('FAIL!');
        console.log(error);
    });
    
    return "Terve mualima!";
}
