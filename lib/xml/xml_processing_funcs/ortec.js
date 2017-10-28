var xmlUtils = require('../xml_utils');

function processResult(err, result, callback) {

    // code->name
    // text->subevent1

    if (!err) {
        var newArr = result.file.ALL_INSTANCES[0].instance.map(function (elem) {
            var tObj = elem;
            console.log(tObj.label);
            var resObj = {
                id: tObj.ID,
                start: [xmlUtils.parseSec(tObj.start[0])],
                end: [xmlUtils.parseSec(tObj.end[0])],
                name: tObj.code,
                subevent1: tObj.label ? xmlUtils.getFieldValues(tObj.label, 'text') : [''],
            };

            resObj = xmlUtils.validateXmlRecord(resObj);
            
            return resObj;

        }).filter(function (elem) {
            return elem ? true : false;
        });

        callback(err, newArr);
        //console.log('newArr', newArr);
    }
    else {
        callback(err, {});
    }

}

module.exports.processResult = processResult;