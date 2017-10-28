var multer = require('multer');
var crypto = require('crypto');
var mime = require('mime');
var Video = require("../models/video");
var User = require("../models/user");
var TrackingData = require("../models/tracking_data");
var EventData = require("../models/event_data");
var fs = require('fs');
const path = require('path');
var jwt = require('jsonwebtoken');
var config = require('../config/database');
var passport = require('passport');
var xmlProcessing = require('../lib/xml/xml_processing');
var isUtf8 = require('../lib/common/is-utf8');
var Playlist = require("../models/playlist");

var getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/tracking_data/')
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
        });
    },
});
var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        var filetypes = /xml|XML|/;

        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        console.log("MimeType", file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
}).single('trackingDataFile');

module.exports = {
    uploadTrackingData: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            upload(req, res, function (err) {
                //console.log(req.file);
                if (err) {
                    return res.status(409).send({
                        success: false,
                        msg: 'Upload Failed.',
                        error: err
                    });
                }
                //console.log("Body", req.body);
                console.log("xmlDataAppType", req.body.xmlDataAppType);
                var newTrackingData = new TrackingData({
                    title: req.body.title,
                    date: new Date(),
                    size: req.file.size,
                    user: req.body.user,
                    video: req.body.video,
                    original_filename: req.file.originalname,
                    filename: req.file.filename,
                    path: req.file.path.replace('public', ''),
                    default: req.body.default
                });

                newTrackingData.save(function (err) {
                    if (err) {
                        return res.json({
                            success: false,
                            msg: 'Save Tracking Data failed.',
                            error: err
                        });
                    }
                    //fs.readFile(req.file.path, 'utf8', function (err,data) {
                    fs.readFile(req.file.path, function (err, data) {
                        if (err) {
                            return console.log(err);
                        }

                        if (!isUtf8(data)) {
                            data = data.toString('ucs2');
                        }
                        else {
                            data = data.toString('utf8');
                        }



                        const Parser = require('xml2js-parser');

                        //var parser = new Parser({trim: true});
                        //parser.parseString(data, (err, result) => {
                        xmlProcessing.parseXmlFile(data, req.body.xmlDataAppType, (err, result) => {
                            //console.log(result['recording']['annotations'][0]['annotation']);
                            console.log(result);

                            var newEventData = new EventData({
                                title: req.body.title,
                                date: new Date(),
                                user: req.body.user,
                                video: req.body.video,
                                //eventData: result['recording']['annotations'][0]['annotation'],
                                eventData: result,
                                default: req.body.default
                            });
                            newEventData.save(function (err) {
                                if (!err) {
                                    console.log('newEventData no error');
                                }
                                else {
                                    console.log('newEventData error:');
                                    console.log(err.message);
                                }

                            });
                        });
                    });
                    res.json({
                        success: true,
                        msg: 'Successfuly created new Tracking Data.',
                    });
                });
            })

        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    getTrackingDataForVideo: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            TrackingData.find({
                video: req.query.id
            }, function (err, data) {
                if (err) return next(err);
                res.json(data);
            });
        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    deleteById: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    if (decoded._doc.role == 1 || decoded._doc.role == 2 || decoded._doc.role == 3 || decoded._doc.role == 4) {
                        TrackingData.findByIdAndRemove({
                            _id: req.query.id
                        }, function (err, tracking_data) {
                            if (err) {
                                res.json({
                                    success: true,
                                    message: 'Failed to deleted Tracking Data.',
                                });
                            }
                            fs.stat("./public" + tracking_data.path, function (err, stats) {
                                if (err) {
                                    return console.error(err);
                                }
                                fs.stat("./public" + tracking_data.path, function (err, stats) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    fs.unlink("./public" + tracking_data.path, (err) => {
                                        if (err) throw err;

                                        TrackingData.remove({ video: req.query.id }, function (err, Videos) {
                                            if (err) {
                                                return next(err);
                                            }
                                            else {
                                                Playlist.updateMany({},
                                                    { $pull: { "playdata": { "video": tracking_data.video } } }).exec(function (err, Clubs) {
                                                        if (err) return next(err);


                                                        EventData.remove({ video: tracking_data.video }, function (err, Videos) {
                                                            if (err) {
                                                                return next(err);
                                                            } else {
                                                                return res.json({
                                                                    success: true,
                                                                    message: 'Successfully deleted Traking Data.'
                                                                });
                                                            }
                                                        });
                                                    });
                                            }
                                        });
                                    });
                                });

                            });
                        });
                    }
                }
            });
        }
    },
}