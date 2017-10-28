var multer = require('multer');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('../config/database');
var passport = require('passport');
var mime = require('mime');
var Video = require("../models/video");
var User = require("../models/user");
var TrackingData = require("../models/tracking_data");
var EventData = require("../models/event_data");
var Playlist = require("../models/playlist");
const path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var nodemailer = require('nodemailer');
const fs = require('fs');
var awsVideo = require('../lib/aws_video');

var videoDir = path.resolve(__dirname + '/../public/videos');
var configDir = path.resolve(__dirname + '/../config/');
var platformMode = require('../config/platform_mode').platformMode;
console.log(platformMode, 'mode');


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sportsanalysisdev@gmail.com',
        pass: 'sports@123'
    }
});
String.prototype.toObjectId = function () {
    var ObjectId = (require('mongoose').Types.ObjectId);
    return new ObjectId(this.toString());
};
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
        cb(null, './public/videos/')
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
        var filetypes = /avi|AVI|wmv|WMV|flv|FLV|mpg|MPG|mp4|MP4|mov|MOV|qt|QT/;

        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        console.log("MimeType", file.mimetype);
        if (mimetype && extname) {
            //if (extname) {
            return cb(null, true);
        }
        cb("Error: File upload only supports the following filetypes - " + filetypes + " Sent file is: " + extname + " mime type is:" + file.mimetype);
    }
}).single('videoFile');

module.exports = {
    uploadVideo: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Unauthorized.'
                    });
                } else {
                    upload(req, res, function (err) {
                        //console.log(req.file);
                        if (err) {
                            return res.status(409).send({
                                success: false,
                                message: 'Upload Failed.',
                                error: err
                            });
                        }
                        //console.log("Body", req.body);
                        var sec = 4;
                        var screenshotName = "/video-screenshots/" + req.file.filename.split(".")[0] + "-at-4s.png"
                        var proc = new ffmpeg(req.file.path)
                            .screenshots({
                                timestamps: [4],
                                filename: req.file.filename.split(".")[0] + '-at-%ss.png',
                                folder: './public/video-screenshots/',
                                size: '320x240'
                            }).on('end', function (result) {
                                console.log('Processing finished !', result);
                            });

                        // upload to S3

                        awsVideo.uploadS3(videoDir + '/' + req.file.filename, 'videos-' + platformMode + '/' + req.file.filename, function () {
                            fs.unlink(videoDir + '/' + req.file.filename, function (err) {
                                if (err && err.code == 'ENOENT') {
                                    // file doens't exist
                                    console.info("File doesn't exist, won't remove it.");
                                } else if (err) {
                                    // other errors, e.g. maybe we don't have enough permission
                                    console.error("Error occurred while trying to remove file");
                                } else {
                                    console.info('File removed successfully');
                                }
                            });
                        });

                        // upload to S3    

                        var newVideo = new Video({
                            title: req.body.title,
                            type: req.body.type,
                            date: new Date(req.body.date),
                            mimetype: req.file.mimetype,
                            screenshot_path: screenshotName,
                            size: req.file.size,
                            user: req.body.user,
                            original_filename: req.file.originalname,
                            filename: req.file.filename,
                            path: '/videos-' + platformMode + '/' + req.file.path.replace(/^.*?([^\\\/]+)$/, '$1'),
                            location: req.body.location,
                            team1: req.body.team1,
                            team2: req.body.team2,
                            club: req.body.club,
                            club2: req.body.club2,
                            competition: req.body.competition,
                            description: req.body.description,
                            scoreTeam1: req.body.scoreTeam1,
                            scoreTeam2: req.body.scoreTeam2,
                            season: req.body.season,
                            tacticsTeam1: req.body.tacticsTeam1,
                            tacticsTeam2: req.body.tacticsTeam2,
                        });

                        newVideo.save({ validateBeforeSave: false }, function (err, video) {
                            if (err) {
                                return res.json({
                                    success: false,
                                    message: 'Save Video failed.',
                                    error: err
                                });
                            }
                            res.json({
                                success: true,
                                message: 'Successfuly created new Video.',
                                video: video
                            });
                        });
                    })
                }
            });
        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    updateVideo: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {

                    if (req.body.type == 'Training') {
                        console.log("Training", req.body.type);

                        Video.findOneAndUpdate({ _id: req.query.id }, { $set: { title: req.body.title, date: req.body.date, type: req.body.type } }, function (err, video) {
                            if (err) return res.send(500, { error: err });
                            return res.send(video);
                        });

                    } else {
                        Video.findOneAndUpdate({ _id: req.query.id }, req.body, function (err, video) {
                            if (err) return res.send(500, { error: err });
                            return res.send(video);
                        });

                    }
                    // Video.findOneAndUpdate({ _id: req.query.id }, req.body, { runValidators: false, upsert: false }, function (err, video) {

                }
            });
        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    getVideos: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    if (decoded._doc.role == 1) {

                        Video.aggregate([{
                            $lookup:
                            {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "createduser"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club",
                                foreignField: "_id",
                                as: "club1details"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club2",
                                foreignField: "_id",
                                as: "club2details"
                            }
                        },
                        ]).exec(function (err, Videos) {
                            if (err) return next(err);
                            Videos.forEach(function (value) {
                                value.user = {};
                                value.user._id = value['createduser'][0]['_id'];
                                value.user.firstName = value['createduser'][0]['firstName'];
                                value.user.lastName = value['createduser'][0]['lastName'];
                                value.user.club = value['createduser'][0]['club'];
                                value.user.clubFunction = value['createduser'][0]['clubFunction'];
                                if (value.type != 'Training') {
                                    value.clubname1 = value['club1details'][0]['name'];
                                    value.clubname2 = value['club2details'][0]['name'];
                                }
                            });
                            res.json(Videos);
                        });
                    } else if (decoded._doc.role == 2 || decoded._doc.role == 3 || decoded._doc.role == 4) {
                        // Video.find({ $or: [{ 'assignedUsers': decoded._doc._id }, { 'user': decoded._doc._id }] }).sort({ 'date': -1 }).populate('user', 'club clubFunction firstName lastName').exec(function (err, Videos) {
                        //     if (err) return next(err);
                        //     res.json(Videos);
                        // });
                        Video.aggregate([{
                            $lookup:
                            {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "createduser"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club",
                                foreignField: "_id",
                                as: "club1details"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club2",
                                foreignField: "_id",
                                as: "club2details"
                            }
                        },
                        {
                            $match: { $or: [{ 'createduser.club': decoded._doc.club.toObjectId() }, { 'assignedUsers': decoded._doc._id }, { 'user': decoded._doc._id.toObjectId() }] }
                        }]).exec(function (err, Videos) {
                            if (err) return next(err);
                            Videos.forEach(function (value) {
                                value.user = {};
                                value.user._id = value['createduser'][0]['_id'];
                                value.user.firstName = value['createduser'][0]['firstName'];
                                value.user.lastName = value['createduser'][0]['lastName'];
                                value.user.club = value['createduser'][0]['club'];
                                value.user.clubFunction = value['createduser'][0]['clubFunction'];
                                if (value.type != 'Training') {
                                    value.clubname1 = value['club1details'][0]['name'];
                                    value.clubname2 = value['club2details'][0]['name'];
                                }


                            });
                            res.json(Videos);
                        });
                    }
                    else {
                        Video.aggregate([{
                            $lookup:
                            {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "createduser"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club",
                                foreignField: "_id",
                                as: "club1details"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club2",
                                foreignField: "_id",
                                as: "club2details"
                            }
                        },
                        {
                            $match: { $or: [{ 'createduser.club': decoded._doc.club.toObjectId() }, { 'assignedUsers': decoded._doc._id }] }
                        }]).exec(function (err, Videos) {
                            if (err) return next(err);
                            Videos.forEach(function (value) {
                                value.user = {};
                                value.user._id = value['createduser'][0]['_id'];
                                value.user.firstName = value['createduser'][0]['firstName'];
                                value.user.lastName = value['createduser'][0]['lastName'];
                                value.user.club = value['createduser'][0]['club'];
                                value.user.clubFunction = value['createduser'][0]['clubFunction'];
                                if (value.type != 'Training') {
                                    value.clubname1 = value['club1details'][0]['name'];
                                    value.clubname2 = value['club2details'][0]['name'];
                                }
                            });
                            res.json(Videos);
                        });
                        //  Video.find({ $or:[ {'club':decoded._doc.club}, {'assignedUsers':decoded._doc._id}]}).sort({'date':-1}).populate('user', 'club clubFunction firstName lastName').exec(function (err, Videos) {
                        //     if (err) return next(err);
                        //     res.json(Videos);
                        // }); 
                    }

                }
            });
        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    getVideosClub: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {

                    Video.aggregate([
                        {
                            $lookup:
                            {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "createduser"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club",
                                foreignField: "_id",
                                as: "club1details"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club2",
                                foreignField: "_id",
                                as: "club2details"
                            }
                        },
                        {
                            $match: { $or: [{ 'createduser.club': decoded._doc.club.toObjectId() }, { 'assignedUsers': decoded._doc._id }] }
                        }]).exec(function (err, Videos) {
                            if (err) return next(err);
                            Videos.forEach(function (value) {
                                value.user = {};
                                value.user._id = value['createduser'][0]['_id'];
                                value.user.firstName = value['createduser'][0]['firstName'];
                                if (value.type != 'Training') {
                                    value.clubname1 = value['club1details'][0]['name'];
                                    value.clubname2 = value['club2details'][0]['name'];
                                }
                            });
                            res.json(Videos);
                        });
                }
            });
        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    getVideoById: function (req, res) {
        var token = getToken(req.headers);

        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    if (decoded._doc.role == 1) {
                        var id = req.query.id;
                        Video.aggregate([
                            {
                                $lookup:
                                {
                                    from: "users",
                                    localField: "user",
                                    foreignField: "_id",
                                    as: "user"
                                }
                            },
                            {
                                $lookup:
                                {
                                    from: "clubs",
                                    localField: "club",
                                    foreignField: "_id",
                                    as: "club1details"
                                }
                            },
                            {
                                $lookup:
                                {
                                    from: "clubs",
                                    localField: "club2",
                                    foreignField: "_id",
                                    as: "club2details"
                                }
                            },
                            {
                                $match: { '_id': req.query.id.toObjectId() }
                            }]).exec(function (err, Videos) {
                                if (err) return next(err);
                                var video = {};
                                video = Videos[0];
                                Video.findOneAndUpdate({ '_id': req.query.id },
                                    { $inc: { "viewCounter": 1 } },
                                    function (err, updateVideo) {
                                        if (err) {
                                            return res.json({
                                                success: false,
                                                message: 'Failed to get video.'
                                            });
                                        }
                                    });
                                res.json(video);
                            });
                    }
                    else if (decoded._doc.role == 2 || decoded._doc.role == 3 || decoded._doc.role == 4) {

                        Video.aggregate([
                            {
                                $lookup:
                                {
                                    from: "users",
                                    localField: "user",
                                    foreignField: "_id",
                                    as: "user"
                                }
                            },
                            {
                                $lookup:
                                {
                                    from: "clubs",
                                    localField: "club",
                                    foreignField: "_id",
                                    as: "club1details"
                                }
                            },
                            {
                                $lookup:
                                {
                                    from: "clubs",
                                    localField: "club2",
                                    foreignField: "_id",
                                    as: "club2details"
                                }
                            },
                            {
                                $match: { $and: [{ '_id': req.query.id.toObjectId() }, { $or: [{ 'user.club': decoded._doc.club.toObjectId() }, { 'assignedUsers': decoded._doc._id }, { 'user': decoded._doc._id }] }] }
                            }]).exec(function (err, Videos) {
                                if (err) return next(err);
                                var video = {};
                                video = Videos[0];
                                // Video.findOneAndUpdate({ '_id': req.query.id },
                                //     { $inc: { "viewCounter": 1 } },
                                //     function (err, updateVideo) {
                                //         if (err) {
                                //             return res.json({
                                //                 success: false,
                                //                 message: 'Failed to get video.'
                                //             });
                                //         }
                                //         res.json(video);
                                //     });
                                res.json(video);
                            });
                    }
                    else {

                        Video.aggregate([
                            {
                                $lookup:
                                {
                                    from: "users",
                                    localField: "user",
                                    foreignField: "_id",
                                    as: "user"
                                }
                            },
                            {
                                $lookup:
                                {
                                    from: "clubs",
                                    localField: "club",
                                    foreignField: "_id",
                                    as: "club1details"
                                }
                            },
                            {
                                $lookup:
                                {
                                    from: "clubs",
                                    localField: "club2",
                                    foreignField: "_id",
                                    as: "club2details"
                                }
                            },
                            {
                                $match: { $and: [{ '_id': req.query.id.toObjectId() }, { $or: [{ 'user.club': decoded._doc.club.toObjectId() }, { 'assignedUsers': decoded._doc._id }] }] }
                            }]).exec(function (err, Videos) {
                                if (err) return next(err);
                                var video = {};
                                video = Videos[0];
                                Video.findOneAndUpdate({ '_id': req.query.id },
                                    { $inc: { "viewCounter": 1 } },
                                    function (err, updateVideo) {
                                        if (err) {
                                            return res.json({
                                                success: false,
                                                message: 'Failed to get video.'
                                            });
                                        }
                                    });
                                res.json(video);
                            });
                    }
                }
            });
        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    deleteVideoById: function (req, res) {
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
                        Video.findByIdAndRemove({
                            _id: req.query.id
                        }, function (err, Videos) {
                            if (err) return next(err);

                            // remove from amazon

                            awsVideo.deleteS3(Videos.path.replace(/^[\\\/]/, ''), function (err, data) {
                                console.log('S3 deletion');
                                console.log(Videos.path);
                                console.log(err);
                                console.log(data);
                            });




                            fs.stat("./public" + Videos.screenshot_path, function (err, stats) {
                                if (err) {
                                    return res.json({
                                        success: false,
                                        message: 'Failed to get Video thumbnail.'
                                    });
                                }
                                fs.stat("./public" + Videos.screenshot_path, function (err, stats) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    fs.unlink("./public" + Videos.screenshot_path, (err) => {
                                        if (err) throw err;
                                        console.log('successfully deleted video thumbnail');
                                    });
                                });
                                TrackingData.find({
                                    video: req.query.id
                                }, function (err, tracking_data) {
                                    if (err) {
                                        return res.json({
                                            success: false,
                                            message: 'Failed to get TrackingData.'
                                        });
                                    } else {
                                        if (tracking_data && tracking_data.length > 0) {
                                            tracking_data.forEach(function (value) {
                                                fs.stat("./public" + value.path, function (err, stats) {
                                                    if (err) {
                                                        return console.error(err);
                                                    }
                                                    fs.unlink("./public" + value.path, (err) => {
                                                        if (err) throw err;
                                                        console.log('successfully deleted video');
                                                    });
                                                });
                                            });
                                        }
                                        TrackingData.remove({ video: req.query.id }, function (err, Videos) {
                                            if (err) {
                                                return next(err);
                                            }
                                            else {
                                                Playlist.updateMany({},
                                                    { $pull: { "playdata": { "video": req.query.id } } }).exec(function (err, Clubs) {
                                                        if (err) return next(err);
                                                        EventData.remove({ video: req.query.id }, function (err, Videos) {
                                                            if (err) {
                                                                return next(err);
                                                            } else {
                                                                return res.json({
                                                                    success: true,
                                                                    message: 'Successfully deleted video.'
                                                                });
                                                            }
                                                        });
                                                    });
                                            }
                                        });
                                    }
                                });
                            });
                        });
                    }
                }
            });
        }
    },

    assignUsers: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Unauthorized.'
                    });
                } else {
                    if (decoded._doc.role == 1 || decoded._doc.role == 2 || decoded._doc.role == 3 || decoded._doc.role == 4) {
                        // req.body.users.forEach(function(value){

                        Video.findByIdAndUpdate(req.body.id, { $set: { 'assignedUsers': req.body.users } }, function (err, playlist) {
                            if (err) {
                                return res.json({
                                    success: false,
                                    message: 'Assign video to User Failed.',
                                    error: err
                                });
                            }
                        });
                        // });
                        res.json({
                            success: true,
                            message: 'Assigned video to User Successfuly.',
                        });

                        User.find({ _id: { $in: req.body.users } }, function (err, array) {
                            if (err) {
                            } else {
                                var uEmail = [];
                                array.forEach(function (usr) {
                                    uEmail.push(usr.email);
                                });

                                var mailOptions = {
                                    from: 'sportsanalysisdev@gmail.com',
                                    to: uEmail.toString(),
                                    subject: 'New video shared from sportsanalysis',
                                    html: "<p><b>Hi there,</b><br>There is a new video ready to watch for you, please click on the following link</p><br><a href='" + req.body.url + "' style='font-size:16px; font-weight: bold; font-family: Helvetica, Arial, sans-serif; text-decoration: none; line-height:40px; width:100%; display:inline-block'><span style='color: #fff;background-color:#28a745;font-size: 1rem;line-height: 1.25;border-radius:.25rem;white-space: nowrap;display: inline-block;font-weight: 400;margin-left:40%;padding:1%;'> Watch Video </span></a>"
                                };
                                transporter.sendMail(mailOptions, function (error, info) {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        // console.log('id',req.body.url);
                                        console.log('Email sent: ' + info.response);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        } else {
            return res.status(403).send({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },



}