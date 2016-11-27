var request = require('request');

/**
 * Parses sendspace response from uploading the file. Response is in text format instead of xml so custom parsing
 * is needed.
 * @param response response text from sendspace when finishing file upload
 * @return {Object} object containing key-value pairs of the response
 */
var sendSpaceUploadResponseToJson = function(response) {
    var responseObj = {};
    var responseLines = response.split('\n');
    responseLines.forEach(function(line) {
        if(line) {
            var splittedLine = line.split('=');
            responseObj[splittedLine[0]] = splittedLine[1];
        }
    });
    return responseObj;
}

/**
 * Uploads file to the sendspace
 * @param url url for uploading, this is get from sendspace api via upload.getInfo.
 * @param formData form data containing needed information for uploading the file
 * @return {Promise<Object>} promise to the response of the sendspace API
 */
var uploadFile = function(url, formData) {
    return new Promise(function(resolve, reject) {
        request.post({url: url, formData: formData}, function (error, response, body) {
            if (error) {
                reject(error);
            }

            var respJson = sendSpaceUploadResponseToJson(body);
            if (respJson.upload_status === 'ok') {
                resolve(respJson);
            } else {
                reject(respJson);
            }
        });
    });
}

module.exports = uploadFile;