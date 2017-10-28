var xmlUtils = require('../xml_utils');

function processResult(err, result, callback) {

    // code->playername
    // text->name
    // group->subevent1
    // pos_x->pos_x
    // pos_y->pos_y

    if (!err) {
        var newArr = result.file.ALL_INSTANCES[0].instance.map(function (elem) {
            var tObj = elem;
            console.log(tObj.label);
            var resObj = {
                id: tObj.ID,
                start: tObj.start,
                end: tObj.end,
                playername: tObj.code,
                name: tObj.label ? xmlUtils.getFieldValues(tObj.label, 'text') : [''],
                subevent1: tObj.label ? xmlUtils.getFieldValues(tObj.label, 'group') : [''],
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