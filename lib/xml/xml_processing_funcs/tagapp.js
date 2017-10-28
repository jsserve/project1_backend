var xmlUtils = require('../xml_utils');

function processResult(err, result, callback) {

    if (!err) {
        var eventData = result['recording']['annotations'][0]['annotation'];

        var newArr = eventData.map(function(resObj) {
            resObj = xmlUtils.validateXmlRecord(resObj);
            return resObj;
        }).filter(function (elem) {
            return elem ? true : false;
        });
        
        callback(err, newArr);

    }
    else {
        callback(err, {});
    }

}

module.exports.processResult = processResult;