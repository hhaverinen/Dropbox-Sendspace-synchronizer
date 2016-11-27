var foldersUtils = {};

/**
 * Checks if given folder exists in sendspace already. This method uses saved JSON of folders and does not
 * make any requests straight to the sendspace API
 * @param folderPath whole path to the folder
 * @return {boolean} true if folder exists, false otherwise
 */
foldersUtils.folderExists = function(folderPath) {
    var pathArray = folderPath.substring(1).split('/');
    if (this.folders && pathArray.length > 0) {
        var parentId = 0; // initialize this with sendspace root folderId
        for(var i = 0; i < pathArray.length; i++) {
            var folder = this.folders[pathArray[i]];
            if (i === pathArray.length - 1) {
                if(!folder) {
                    return false;
                }
                return (folder.parentId == parentId);
            } else {
                if(!folder) {
                    return false;
                }
                if (folder.parentId == parentId) {
                    parentId = folder.id;
                } else {
                    return false;
                }
            }
        }
    }

    return false;
}

/**
 * Checks whether given folder already exists in sendspace, and if not, creates it
 * @param folderName name of the folder
 * @param parentId id of the given folder's parent
 * @return {Promise<*>} promise to the id of the folder's parent
 */
foldersUtils.checkAndCreateFolder = function(folderName, parentId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var folder = self.folders[folderName];
        if (folder && folder.parentId == parentId) {
            resolve(folder.id);
        } else {
            self.createFolder(folderName, parentId).then(function(body) {
                var createdFolder = body.result.folder.$;
                self.folders[createdFolder.name] = {id: createdFolder.id, parentId: createdFolder.parent_folder_id};
                resolve(createdFolder.id);
            }).catch(function(body) {
                reject(body);
            });
        }
    });
}

/**
 * Synchronizes given folderpath starting from specific folder
 * @param folderPathArray array containing pieces of the path
 * @param parentFolderId sendspace folderId where to 'start' synchronizing
 * @return {Promise} promise for the success of synchronizing the given folderpath
 */
foldersUtils.syncFolderPathArray = function(folderPathArray, parentFolderId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var parentId = parentFolderId || 0;
        var folder = folderPathArray.shift();

        var responseHandler = function(response) {
            if (folderPathArray.length > 0) {
                self.syncFolderPathArray(folderPathArray, response).then(function() {
                    resolve();
                }).catch(function(body) {
                    reject(body);
                });
            } else {
                resolve(); // success for creating all the folders
            }
        }

        self.checkAndCreateFolder(folder, parentId).then(responseHandler).catch(function(error) {
            reject(error);
        });

    });
}

/**
 * Method for synchronizing folderpath with sendspace
 * @param folderPath whole path of the folder
 * @return {Promise} promise for the success of synchronizing the given folderpath
 */
foldersUtils.syncFolderPath = function(folderPath) {
    var pathArray = folderPath.substring(1).split('/');
    return this.syncFolderPathArray(pathArray);
}

/**
 * Synchronizes given folders to sendspace
 * @param folderPaths array containing whole paths for the folders
 * @return {Promise} promise for the success of synchronizing the folders
 */
foldersUtils.syncFolders = function(folderPaths) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var folderPath = folderPaths.shift();

        var responseHandler = function() {
            if (folderPaths.length > 0) {
                self.syncFolders(folderPaths).then(function() {
                    resolve();
                }).catch(function(body) {
                    reject(body);
                });
            } else {
                resolve(); // all folders synced
            }
        }

        self.syncFolderPath(folderPath).then(responseHandler).catch(function(error) {
            reject(error);
        });
    });
}

module.exports = foldersUtils;