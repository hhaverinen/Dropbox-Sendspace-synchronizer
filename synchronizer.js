var Dropbox = require('dropbox');
var SendSpace = require('./SendSpaceClient/SendSpace');
var request = require('request');

var dbConf = require('./config/dropboxConfig');
var ssConf = require('./config/sendspaceConfig');

var dbx = new Dropbox(dbConf);
var ss = new SendSpace(ssConf);


// gets all the files from dropbox recursively
var listDropBoxFiles = function(dbx, cursor) {
    if (!cursor) {
        dbx.filesListFolder({ path: '', recursive: true })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);
                    /*
                    ss.uploadFileToSendSpace(item.name, request.get(getDropBoxDownloadParams(item.path_display, dbConf.accessToken))).then(function(response) {
			            console.log(response.result.file.$);
	            	}).catch(function(response) {
			            console.log(response);
			        });
			        */
                });
                if (response.has_more) {
                    listDropBoxFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    } else {
        dbx.filesListFolderContinue({ cursor: cursor })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);
                    /*
                    ss.uploadFileToSendSpace(item.name, request.get(getDropBoxDownloadParams(item.path_display, dbConf.accessToken))).then(function(response) {
			            console.log(response.result.file.$);
	            	}).catch(function(response) {
			            console.log(response);
			        });
			        */
                });
                if (response.has_more) {
                    listDropBoxFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    }
}

var getDropBoxDownloadParams = function(filepath, authToken) {
    return {
        url: 'https://content.dropboxapi.com/2/files/download',
        headers: {
            'Dropbox-API-Arg': JSON.stringify({path: filepath}),
            'Authorization': 'Bearer '+authToken
        }
    }
}

module.exports = function() {
    //listDropBoxFiles(dbx);
    //getSendspaceSessionkey(uploadFileToSendSpace);
    
    ss.getSessionkey().then(function(response) {
	    console.log('=== SUCCESS!');
	    //console.log('=== START SENDING FILES!');
	    //listDropBoxFiles(dbx);

        ss.getAllFolders().then(function(response) {
            console.log(response);
            /*
            response.result.folder.forEach(function(item) {
                console.log(item);
            });
            */

        }).catch(function(response) {
            console.log(response);
        });

    }).catch(function(error){
	console.log('=== FAIL!');
        console.log(error);
    });
	
    
    return "Terve mualima!";
}
