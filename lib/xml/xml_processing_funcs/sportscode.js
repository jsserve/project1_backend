var xmlUtils = require('../xml_utils');

function processResult(err, result, callback) {

    // code->name
    // group->subevent1
    // text->subevent2

    if (!err) {
        var newArr = result.file.ALL_INSTANCES[0].instance.map(function (elem) {
            var tObj = elem;
            var resObj = {
                id: tObj.ID,
                start: [xmlUtils.parseSec(tObj.start[0])],
                end: [xmlUtils.parseSec(tObj.end[0])],
                name: tObj.code,
                subevent1: tObj.label ? tObj.label[0].group : [''],
                subevent2: tObj.label ? tObj.label[0].text : [''],
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