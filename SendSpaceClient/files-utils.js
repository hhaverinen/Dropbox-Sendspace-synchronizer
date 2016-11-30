var filesUtils = {};

/**
 * Check whether file exists already in sendspace. This method uses saved JSON of files and folders and does not
 * make any requests straight to the sendspace API
 * @param filepath whole filepath of the file
 * @return {boolean} true if file already exists, false otherwise.
 */
filesUtils.fileExists = function(filepath) {
    var pathArray = filepath.substring(1).split('/');
    if (this.folders && pathArray.length > 0) {
        var parentId = 0; // initialize this with sendspace root folderId

        // a little bit different handling if file is in root directory
        if (pathArray.length == 1) {
            var folder = this.folders['Default']; // sendspace root directory is named 'Default'
            var file = folder.files[pathArray[0]];
            if (!file) {
                return false;
            }
            return true;
        }

        // file not in root directory, iterate trough path and find if file exists
        for(var i = 0; i < pathArray.length; i++) {
            var folder = this.folders[pathArray[i]];
            if (i == pathArray.length - 2) {
                if (!folder) {
                    return false;
                }

                var file = folder.files[pathArray[i+1]];
                if (!file) {
                    return false;
                }
                return true;
            } else {
                if (!folder) {
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
 * Returns folder id of the file, whether the file exists in sendspace or not. This method uses saved JSON of files
 * and folders and does not make any requests straight to the sendspace API
 * @param filePath whole filepath of the file
 * @return {*} return ID of the folder. If folder is not found, method return id of the root folder (= 0)
 */
filesUtils.getParentFolder = function(filePath) {
    var pathArray = filePath.substring(1).split('/');

    if (this.folders && pathArray.length > 1) {
        var parentId = 0;
        for(var i = 0; i < pathArray.length - 1; i++) {
            var folder = this.folders[pathArray[i]];
            if (i === pathArray.length - 2) {
                if (folder) {
                    return folder.id;
                } else {
                    return 0; // if folder was not found, return root folder id
                }
            } else {
                if (!folder) {
                    return 0;
                }
                if (folder.parentId == parentId) {
                    parentId = folder.id;
                } else {
                    return 0;
                }
            }
        }
    }

    return 0;
}

module.exports = filesUtils;