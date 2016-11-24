var Dropbox = require('dropbox');
var SendSpace = require('./SendSpaceClient/SendSpace');
var request = require('request');
var extend = require('extend');

var dbConf = require('./config/dropboxConfig');
var ssConf = require('./config/sendspaceConfig');

var dbContentExists = function(path, tag, ss) {
    if (tag == 'file') {
        return ss.fileExists(path);
    } else if (tag == '.folder') {
        return ss.folderExists(path)
    }
    return false;
}

// gets all the files from dropbox recursively
var getAllDropBoxFilesAndFolders = function(dbx, cursor, contents) {
    return new Promise(function(resolve, reject) {
        var contents = contents || [];

        var responseHandler = function(response) {
            contents = contents.concat(response.entries);

            if (response.has_more) {
                return getAllDropBoxFilesAndFolders(dbx, response.cursor, contents)
            } else {
                resolve(contents);
            }
        }

        if(!cursor) {
            dbx.filesListFolder({ path: '', recursive: true }).then(responseHandler);
        } else {
            dbx.filesListFolderContinue({ cursor: cursor }).then(responseHandler);
        }
    });
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
    /*
    ss.startSession().then(function(response) {
        console.log(response);
    }).catch(function(error) {
        console.log(error);
    });*/

    /*
    response.entries.forEach(function(item) {
        console.log(item);

        if (!dbContentExists(item.path_display, item['.tag'], ss)) {
            console.log("=== Started to sync file: " + item.path_display)
            ss.uploadFileToSendSpace(item.name, request.get(getDropBoxDownloadParams(item.path_display, dbConf.accessToken))).then(function (response) {
                console.log(response);
                //console.log(response.result.file.$);
            }).catch(function (response) {
                console.log(response);
            });
        }
    });
    */


    ss.startSession().then(function(response) {
	    console.log('=== LOGIN SUCCESS!');

        ss.getAllFoldersAndFiles().then(function(response) {
            //console.log(response);

            //console.log(ss.fileExists("/kissa/kissanpoika/kilpikonna/testi.txt"));
            getAllDropBoxFilesAndFolders(dbx).then(function(entries) {
                var folders = [], files = [];

                entries.forEach(function(item) {
                    if (item['.tag'] == 'folder') {
                        folders.push(item);
                    } else {
                        files.push(item);
                    }
                });

                //TODO: sync folders

                //TODO: sync files

                //logout
                ss.endSession().then(function(response) {
                    console.log("=== LOGOUT SUCCESS");
                });
            });
        });

    }).catch(function(error){
	    console.log('=== FAIL!');
        console.log(error);
    });

    
    return "Terve mualima!";
}
