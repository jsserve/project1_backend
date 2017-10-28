var User = require("../models/user");
var Club = require("../models/club");
var Video = require("../models/video");
var Events = require("../models/event_data");
var jwt = require('jsonwebtoken');
var config = require('../config/database');
var passport = require('passport');
var mime = require('mime');
var crypto = require('crypto');
var multer = require('multer');
const path = require('path');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sportsanalysisdev@gmail.com',
        pass: 'sports@123'
    }
});

require('../config/passport')(passport);

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

    getEventDetails: function (req, res) {
        // var token = getToken(req.headers);
        // if (token) {
        //     jwt.verify(token, config.secret, function (err, decoded) {
        //         if (err) {
        //             return res.status(403).json({
        //                 success: false,
        //                 message: 'Failed to authenticate token.'
        //             });
        //         } else {

        Events.findOne({ 'video': req.body.videoId, _id: req.body.eventId }, function (err, events) {
            if (err) return next(err);
            res.json(events);
        });
        //     }
        // });
        // } else {
        //     return res.status(403).send({
        //         success: false,
        //         msg: 'Unauthorized.'
        //     });
        // }
    },
    shareEvent: function (req, res) {
        // var token = getToken(req.headers);
        // if (token) {
        //     jwt.verify(token, config.secret, function (err, decoded) {
        //         if (err) {
        //             return res.status(403).json({
        //                 success: false,
        //                 message: 'Failed to authenticate token.'
        //             });
        //         } else {

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
                    subject: 'New Event shared from sportsanalysis',
                    html: "<p><b>Hi there,</b><br>There is a new video event ready to watch for you, please click on the following link</p><br><a href='" + req.body.url + "' style='font-size:16px; font-weight: bold; font-family: Helvetica, Arial, sans-serif; text-decoration: none; line-height:40px; width:100%; display:inline-block'><span style='color: #fff;background-color:#28a745;font-size: 1rem;line-height: 1.25;border-radius:.25rem;white-space: nowrap;display: inline-block;font-weight: 400;margin-left:40%;padding:1%;'> Watch Event </span></a>"
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                        res.json({
                            success: false,
                            message: 'Event shared with user failed.',
                        });
                    } else {
                        res.json({
                            success: true,
                            message: 'Event shared with user successfuly.',
                        });
                    }
                });
            }
        });
        //     }
        // });
        // } else {
        //     return res.status(403).send({
        //         success: false,
        //         msg: 'Unauthorized.'
        //     });
        // }
    },

    getEventsByVideo: function (req, res) {
        Events.find({ 'video': req.body.videoId }, function (err, events) {
            if (err) return next(err);
            res.json(events);
        });
    },
}