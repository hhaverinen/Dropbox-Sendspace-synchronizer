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
            console.log(response.has_more);

            if (response.has_more) {
                getAllDropBoxFilesAndFolders(dbx, response.cursor, contents).then(function(contents) {
                    resolve(contents);
                });
            } else {
                resolve(contents);
            }
        }

        if(!cursor) {
            console.log("call files list folder");
            dbx.filesListFolder({ path: '', recursive: true }).then(responseHandler);
        } else {
            console.log("call files list folder continue");
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

        return ss.getAllFoldersAndFiles().then(function(response) {
            //console.log(response);

            //console.log(ss.fileExists("/kissa/kissanpoika/kilpikonna/testi.txt"));
            return getAllDropBoxFilesAndFolders(dbx).then(function(entries) {
                var folders = [], files = [];

                entries.forEach(function(item) {
                    if (item['.tag'] == 'folder') {
                        folders.push(item.path_display); // only paths are needed
                    } else {
                        files.push(item);
                    }
                });

                console.log(folders);
                //console.log(files);

                //TODO: sync folders
                //folders = ['/testi1/testi2'];
                return ss.syncFolders(folders).then(function(response) {
                    console.log(response);
                    console.log('=== SYNCED ALL FOLDERS!');
                });

                //TODO: sync files


                /*
                //logout
                ss.endSession().then(function(response) {
                    console.log('=== LOGOUT SUCCESS');
                });
                */
            });
        });

    }).catch(function(error){
	    console.log('=== FAIL!');
        console.log(error);
    }).then(function() {
        return ss.endSession().then(function() {
            console.log('=== LOGOUT SUCCESS');
        });
    }).catch(function(error) {
        console.log('=== LOGOUT FAIL');
        console.log(error);
    });

    
    return "Terve mualima!";
}
