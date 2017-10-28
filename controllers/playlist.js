var multer = require('multer');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('../config/database');
var passport = require('passport');
var User = require("../models/user");
var Playlist = require("../models/playlist");
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sportsanalysisdev@gmail.com',
        pass: 'sports@123'
    }
});




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


module.exports = {
    createPlaylist: function (req, res) {
        newEvents = [];
        if (req.body.events) {
            req.body.events.forEach(function (element) {
                newEvents.push({ eventId: element.id, eventStart: element.start, eventEnd: element.end, eventName: element.name, eventTeam: element.team, video: req.body.plist.vid, eventDataId: element.eventDataId });
            });

        }
        if (newEvents.length > 0) {
            var newPlaylist = new Playlist({
                name: req.body.plist.playlistName,
                user: req.body.plist.user,
                playdata: newEvents,
                assignedUsers: req.body.plist.user,
            });
        } else {

            var newPlaylist = new Playlist({
                name: req.body.playlistName,
                user: req.body.user,
                playdata: { eventId: req.body.eId, eventStart: req.body.eStrat, eventEnd: req.body.eEnd, eventName: req.body.eName, eventTeam: req.body.eTeam, video: req.body.vid, eventDataId: req.body.eventDataId },
                assignedUsers: req.body.user,
            });
        }

        Playlist.findOne({ name: req.body.playlistName }, function (err, obj) {
            if (obj) {
                return res.json({
                    success: false,
                    message: 'Playlist already exists.',
                });
            }
            else {
                newPlaylist.save(function (err, playlist) {
                    if (err) {
                        return res.json({
                            success: false,
                            message: 'Save Playlist failed.',
                            error: err
                        });
                    }
                    res.json({
                        success: true,
                        message: 'Successfuly created new Playlist and Event added.',
                        playlist: playlist
                    });
                });
            }
        });
    },

    updatePlaylist: function (req, res) {
        newEvents = [];
        if (req.body.events && req.body.events.length > 0) {
            Playlist.findOne({
                _id: req.body.plist.playlistId
            }, function (err, play) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Playlist not found.',
                        error: err
                    });
                }

                req.body.events.forEach(function (data, index) {
                    var playlistdata = play['playdata'].filter(function (element) {
                        return (parseInt(data.id) == parseInt(element.eventId) && req.body.plist.vid == element.video && element.eventDataId == data.eventDataId);
                    });

                    if (typeof (playlistdata) == 'undefined' || playlistdata.length == 0) {
                        Playlist.findByIdAndUpdate(req.body.plist.playlistId, { $push: { 'playdata': { eventId: data.id, eventStart: data.start, eventEnd: data.end, eventName: data.name, eventTeam: data.team, video: req.body.plist.vid, eventDataId: data.eventDataId } } }, function (err, playlist) {
                        });
                    }
                });

            });
            res.json({
                success: true,
                message: 'Successfuly added to Playlist.',
            });
        } else {
            Playlist.findByIdAndUpdate(req.body.playlistId, { $push: { 'playdata': { 'eventId': req.body.eId, 'eventStart': req.body.eStrat, 'eventEnd': req.body.eEnd, 'eventName': req.body.eName, 'eventTeam': req.body.eTeam, 'video': req.body.vid, 'eventDataId': req.body.eventDataId } } }, function (err, playlist) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Save Playlist failed.',
                        error: err
                    });
                }
                res.json({
                    success: true,
                    message: 'Successfuly added to Playlist.',
                });
            });
        }




        // Playlist.find({"_id":req.body.playlistId},function(err,play) {
        //     console.log(play)
        // });
        // Playlist.update(
        //   {_id: req.body.playlistId },
        //   {$push: {'playdata': {'video': req.body.vid,'eventid': req.body.eId}},
        // });
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
                    if (decoded._doc.role == 1 || decoded._doc.role == 2 || decoded._doc.role == 3) {
                        // req.body.users.forEach(function(value){

                        Playlist.findByIdAndUpdate(req.body.id, { $set: { 'assignedUsers': req.body.users } }, function (err, playlist) {
                            if (err) {
                                return res.json({
                                    success: false,
                                    message: 'Assigne Playlist to User Failed.',
                                    error: err
                                });
                            }

                        });
                        // });

                        res.json({
                            success: true,
                            message: 'Assigned Playlist to User Successfuly.',
                        });
                    }
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
                                subject: 'New playlist shared from sportsanalysis',
                                html: "<p><b>Hi there,</b><br>There is a new video playlist ready to watch for you, please click on the following link</p><br><a href='" + req.body.url + "' style='font-size:16px; font-weight: bold; font-family: Helvetica, Arial, sans-serif; text-decoration: none; line-height:40px; width:100%; display:inline-block'><span style='color: #fff;background-color:#28a745;font-size: 1rem;line-height: 1.25;border-radius:.25rem;white-space: nowrap;display: inline-block;font-weight: 400;margin-left:40%;padding:1%;'> Watch Playlist </span></a>"
                            };
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                            });
                        }
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
    fetchPlaylist: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Unauthorized.'
                    });
                } else {
                    if (decoded._doc.role == 1) {
                        Playlist.find({}).populate('user', 'club clubFunction firstName lastName').exec(function (err, playlists) {
                            if (err) return next(err);
                            res.json({
                                success: true,
                                message: 'Successfuly listed playlist.',
                                playlists: playlists
                            });
                        });
                    }
                    else if (decoded._doc.role == 2 || decoded._doc.role == 3 || decoded._doc.role == 4) {
                        User.find({ $and: [{ "club": decoded._doc.club }, { "activate": true }] }, { _id: 1 }).exec(function (err, Users) {
                            if (err) return next(err);
                            else {
                                Playlist.find({ 'user': { $in: Users } }).populate('user', 'club clubFunction firstName lastName').exec(function (err, resPlayList) {

                                    res.json({
                                        success: true,
                                        message: 'Successfuly listed playlist.',
                                        playlists: resPlayList
                                    });
                                })
                            }

                        });


                    }
                    else {
                        Playlist.find({ 'assignedUsers': decoded._doc._id }).populate('user', 'club clubFunction firstName lastName').exec(function (err, playlists) {
                            if (err) return next(err);
                            res.json({
                                success: true,
                                message: 'Successfuly listed playlist.',
                                playlists: playlists
                            });
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
                    Playlist.findOne({
                        _id: req.query.id
                    }, function (err, play) {
                        if (err) return next(err);
                        res.json(play);
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
    fetchPlaylistData: function (req, res) {

        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Unauthorized.'
                    });
                } else {
                    Playlist.find({ '_id': req.query.id }).populate('playdata.video', 'path title date mimetype').exec(function (err, playlists) {
                        if (err) return next(err);
                        res.json({
                            success: true,
                            message: 'Successfuly listed playlist.',
                            playlists: playlists
                        });
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
    deletePlaylist: function (req, res) {

        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Unauthorized.'
                    });
                } else {
                    if (decoded._doc.role == 1 || decoded._doc.role == 2 || decoded._doc.role == 3) {
                        Playlist.findByIdAndRemove({
                            _id: req.body.id
                        }, function (err, playlists) {
                            if (err) {
                                res.json({
                                    success: false,
                                    message: 'Failed to delete playlist.',
                                });
                            }
                            res.json({
                                success: true,
                                message: 'Successfuly Deleted playlist.',
                                playlists: playlists
                            });
                        });
                    } else {
                        res.json({
                            success: true,
                            message: 'You are not authorised to delete.',

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