var request = require('request');

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