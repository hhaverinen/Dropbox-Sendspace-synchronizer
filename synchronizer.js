var Dropbox = require('dropbox');
var SendSpace = require('./SendSpaceClient/SendSpace');
var request = require('request');

var dbConf = require('./config/dropboxConfig');
var ssConf = require('./config/sendspaceConfig');

// gets all the files from dropbox recursively
var getAllDropBoxFilesAndFolders = function(dbx, ss, cursor) {
    if (!cursor) {
        dbx.filesListFolder({ path: '', recursive: true })
            .then(function(response) {
                /*
                response.entries.forEach(function(item) {
                    console.log(item);

                    ss.uploadFileToSendSpace(item.name, request.get(getDropBoxDownloadParams(item.path_display, dbConf.accessToken))).then(function(response) {
			            console.log(response.result.file.$);
	            	}).catch(function(response) {
			            console.log(response);
			        });

                });
                */
                if (response.has_more) {
                    getAllDropBoxFilesAndFolders(dbx, ss, response.cursor);
                }
            }).catch(function(error) {
                console.log(error);
            });
    } else {
        dbx.filesListFolderContinue({ cursor: cursor })
            .then(function(response) {
                /*
                response.entries.forEach(function(item) {
                    console.log(item);

                    ss.uploadFileToSendSpace(item.name, request.get(getDropBoxDownloadParams(item.path_display, dbConf.accessToken))).then(function(response) {
			            console.log(response.result.file.$);
	            	}).catch(function(response) {
			            console.log(response);
			        });

                });
                */
                if (response.has_more) {
                    getAllDropBoxFilesAndFolders(dbx, ss, response.cursor);
                }
            }).catch(function(error) {
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
    var dbx = new Dropbox(dbConf);
    var ss = new SendSpace(ssConf);

    ss.startSession().then(function(response) {
	    console.log('=== LOGIN SUCCESS!');

        ss.getAllFoldersAndFiles().then(function(response) {
            //console.log(response);
            response.forEach(function(item) {
                console.log(item);
            });

            // logout
            ss.endSession().then(function(response) {
                console.log("=== LOGOUT SUCCESS");
            }).catch(function(response) {
                console.log("=== LOGOUT FAIL");
            })

        }).catch(function(error) {
            console.log(error);
        });

    }).catch(function(error){
	    console.log('=== FAIL!');
        console.log(error);
    });
	
    
    return "Terve mualima!";
}
