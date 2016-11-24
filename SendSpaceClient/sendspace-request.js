var request = require('request');
var xml2js = require('xml2js');

/**
 * parses xml to json
 * @param {string} xml string representation of xml
 * @returns {Promise<JSON>} A promise to the json object presentation of xml
 */
var xmlToJson = function(xml) {
    return new Promise(function(resolve, reject) {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(xml, function(error, result) {
            if(error) {
                reject(error);
            }
            resolve(result);
        });
    });
}

/**
 * checks whether the sendspace response was ok or not
 * @param {Object} body response body as json
 * @returns {Promise<JSON} A promise to the given body
 */
var checkSendSpaceResponse = function(body) {
    return new Promise(function(resolve, reject) {
        if (body.result.$.status === 'fail') {
            reject(body);
        }
        resolve(body);
    });
}

/**
 * makes get request to the given url, parses and checks the response
 * @param {string} url endpoint to send the request
 * @returns {Promise<JSON>} A promise to the response
 */
var makeRequest = function (url) {
    return new Promise(function(resolve, reject) {
        request(url, function(error, response, body) {
            if(error) {
                reject(error);
            }

            xmlToJson(body).then(checkSendSpaceResponse).then(function(body) {
                resolve(body);
            }).catch(function(body) {
                reject(body);
            });
        });
    });
}

module.exports = makeRequest;