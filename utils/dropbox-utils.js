var request = require('request');

var utils = {};

/**
 * Gets all the files and folders from the dropbox recursively
 * @param dbx Dropbox object. See https://github.com/dropbox/dropbox-sdk-js
 * @param cursor possible cursor from the dropbox response
 * @param contents this is recursively filled with contents
 * @return {Promise<Array.<Object>] Promise to the array containing all files and folders from the dropbox
 */
utils.getAllDropBoxFilesAndFolders = function(dbx, cursor, contents) {
    return new Promise(function(resolve, reject) {
        var contents = contents || [];

        var responseHandler = function(response) {
            contents = contents.concat(response.entries);

            if (response.has_more) {
                this.getAllDropBoxFilesAndFolders(dbx, response.cursor, contents).then(function(contents) {
                    resolve(contents);
                }).catch(function(error) {
                    reject(error);
                });
            } else {
                resolve(contents);
            }
        }

        if(!cursor) {
            console.log("call files list folder");
            dbx.filesListFolder({ path: '', recursive: true }).then(responseHandler).catch(function(error) {
                reject(error);
            });
        } else {
            console.log("call files list folder continue");
            dbx.filesListFolderContinue({ cursor: cursor }).then(responseHandler).catch(function(error) {
                reject(error);
            });
        }
    });
}

/**
 * Gets params for downloading file from the dropbox
 * @param filepath path to the downloadable file
 * @param authToken authentication token
 * @return {{url: string, headers: {Dropbox-API-Arg, Authorization: string}}}
 */
utils.getDropBoxDownloadParams = function(filepath, authToken) {
    return {
        url: 'https://content.dropboxapi.com/2/files/download',
        headers: {
            'Dropbox-API-Arg': JSON.stringify({path: filepath}),
            'Authorization': 'Bearer '+authToken
        }
    }
}

/**
 * Gets stream for downloading file from the dropbox
 * @param filepath path to the downloadable file
 * @param authToken authentication token
 * @return {Request}
 */
utils.getDropBoxFileDownloadStream = function(filepath, authToken) {
    return request.get(this.getDropBoxDownloadParams(filepath, authToken));
}

module.exports = utils;