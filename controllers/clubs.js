var User = require("../models/user");
var Club = require("../models/club");
var Video = require("../models/video");
var jwt = require('jsonwebtoken');
var config = require('../config/database');
var passport = require('passport');
var mime = require('mime');
var crypto = require('crypto');
var multer = require('multer');
const path = require('path');
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

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/club-logos/')
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
        var filetypes = /gif|GIF|jpg|JPG|jpeg|JPEG|tiff|TIFF|png|PNG/;

        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        // console.log("MimeType", file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
}).single('logoFile');

module.exports = {
    getRequestedClubs: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    // Video.find({}).distinct('team1').exec(function (err, Teams1) {
                    //     if (err) return next(err);
                    //     Video.find({}).distinct('team2').exec(function (err, Teams2) {
                    //         if (err) return next(err);
                    //         var Teams = Teams1.concat(Teams2);
                    //         User.find({}).distinct('club').exec(function (err, UserTeams) {
                    //             if (err) return next(err);
                    //             var AllTeams = Teams.concat(UserTeams);
                    //             AllTeams = AllTeams.filter(function (elem, pos) {
                    //                 return AllTeams.indexOf(elem) == pos;
                    //             });
                    //             var retTeams = [];
                    //             for (var i = 0, len = AllTeams.length; i < len; i++) {
                    //                 retTeams.push({
                    //                     'ClubName': AllTeams[i]
                    //                 });
                    //             }
                    //             res.json(retTeams);
                    //         });
                    //     });
                    // });

                    Club.aggregate([
                        {
                            $lookup:
                            {
                                from: "users",
                                localField: "_id",
                                foreignField: "club",
                                as: "users"
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "videos",
                                localField: "_id",
                                foreignField: "club",
                                as: "videos"
                            }
                        },
                        {
                            $match: { "activated": false }
                        }
                    ]).exec(function (err, Clubs) {
                        if (err) {
                            return res.status(403).json({
                                success: false,
                                message: 'Failed to get clubs.'
                            });
                        }


                        res.json(Clubs);
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

    activateClub: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else if (decoded._doc.role != 1 && decoded._doc.role != 2) {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permissions to do this action.'
                    });
                } else {

                    upload(req, res, function (err) {
                        //console.log(req.file);
                        if (err) {
                            return res.status(409).send({
                                success: false,
                                msg: 'Upload Failed.',
                                error: err
                            });
                        }

                        // console.log( req.body);
                        var newClub = new Club({
                            id: req.body.id,
                            name: req.body.name,
                            slug: req.body.slug,
                            logo: req.file.path.replace('public', ''),
                            location: req.body.location,
                            activated: req.body.activate,
                        });
                        //console.log(newClub);
                        // newClub.save(function (err) {
                        //     if (err) {
                        //         return res.json({
                        //             success: false,
                        //             msg: 'Saving Club failed.',
                        //             error: err
                        //         });
                        //     }
                        //     res.json({
                        //         success: true,
                        //         msg: 'Successfuly saved new Club.'
                        //     });
                        // });
                        req.body.teams = req.body.teams.split(',');
                        Club.update({ _id: req.body.id }, {
                            $set: {
                                name: req.body.name,
                                slug: req.body.slug,
                                logo: req.file.path.replace('public', ''),
                                location: req.body.location,
                                activated: req.body.activate,
                                teams: req.body.teams
                            }
                        }, { upsert: true }, function (err) {
                            if (err) {
                                res.status(409);
                                return res.json({
                                    success: false,
                                    msg: 'Club already registered.',
                                    error: err
                                });
                            }
                            res.json({
                                success: true,
                                message: 'Successfuly updated Club.'
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
    checkClubActive: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    Club.findOne({ '_id': decoded._doc.club }).exec(function (err, Clubs) {
                        if (err) {
                            return res.json({
                                success: false,
                                message: 'Invalid Club'
                            });
                        }
                        res.json(Clubs);
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
    getClubs: function (req, res) {
        // var token = getToken(req.headers);
        // if (token) {
        //     jwt.verify(token, config.secret, function (err, decoded) {
        //         if (err) {
        //             return res.status(403).json({
        //                 success: false,
        //                 message: 'Failed to authenticate token.'
        //             });
        //         } else {
        Club.aggregate([
            {
                $lookup:
                {
                    from: "users",
                    localField: "_id",
                    foreignField: "club",
                    as: "users"
                }
            },
            {
                $lookup:
                {
                    from: "videos",
                    localField: "_id",
                    foreignField: "club",
                    as: "videos"
                }
            },
            {
                $match: { "activated": true }
            }
        ]).exec(function (err, Clubs) {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Failed to get clubs.'
                });
            }
            res.json(Clubs);
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

    deleteClub: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else if (decoded._doc.role != 1) {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permissions to do this action.'
                    });
                } else {
                    Club.findByIdAndRemove(req.query.id, function (err, club) {
                        if (club) {
                            var response = {
                                message: "Club successfully deleted",
                                id: club._id
                            };
                        } else {
                            res.status(403);
                            var response = {
                                message: "Club not found"
                            };
                        }

                        res.send(response);
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

    getClubBySlug: function (req, res) {
        // console.log(req.query)
        Club.findOne(
            { _id: req.query.slug, activated: true }
            , function (err, Club) {
                if (err) {

                    return res.json({
                        success: false,
                        message: 'Not a valid club'
                    });
                }
                res.json(Club);
            });


    },

    createClub: function (req, res) {

        var newClub = new Club({
            name: req.body.name,
            activated: false,
            logo: '',
            slug: req.body.name,
            location: '',
            teams: req.body.teams
        });

        newClub.save(function (err, newClub) {
            if (err) {
                res.status(409);
                return res.json({
                    success: false,
                    msg: 'Club already registered.',
                    error: err
                });
            }
            res.json({
                success: true,
                message: 'Successfuly created new Club.',
                club: newClub
            });
        });

    },

    getAllClubs: function (req, res) {
        // var token = getToken(req.headers);
        // if (token) {
        //     jwt.verify(token, config.secret, function (err, decoded) {
        //         if (err) {
        //             return res.status(403).json({
        //                 success: false,
        //                 message: 'Failed to authenticate token.'
        //             });
        //         } else {

        Club.find({}).exec(function (err, Clubs) {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Failed to get clubs.'
                });
            }
            res.json(Clubs);
        });
        //         }
        //     });
        // } else {
        //     return res.status(403).send({
        //         success: false,
        //         msg: 'Unauthorized.'
        //     });
        // }
    },

    addAndActivateClub: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else if (decoded._doc.role != 1) {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permissions to do this action.'
                    });
                } else {
                    upload(req, res, function (err) {
                        //console.log(req.file);
                        if (err) {
                            return res.status(409).send({
                                success: false,
                                msg: 'Upload Failed.',
                                error: err
                            });
                        }
                        req.body.teams = req.body.teams.split(',');
                        // console.log( req.body);
                        var newClub = new Club({
                            id: req.body.id,
                            name: req.body.name,
                            slug: req.body.slug,
                            logo: req.file.path.replace('public', ''),
                            location: req.body.location,
                            activated: req.body.activate,
                            teams: req.body.teams
                        });
                        //console.log(newClub);
                        newClub.save(function (err) {
                            if (err) {
                                res.status(409);
                                return res.json({
                                    success: false,
                                    msg: 'Club already registered.',
                                    error: err
                                });
                            }
                            res.json({
                                success: true,
                                msg: 'Successfuly saved new Club.'
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

    updateClubwithoutLogo: function (req, res) {

        Club.update({ _id: req.body.id }, {
            $set: {
                name: req.body.name,
                slug: req.body.slug,
                location: req.body.location,
                activated: req.body.activate,
                teams: req.body.teams
            }
        }, { upsert: true }, function (err) {
            if (err) {
                res.status(409);
                return res.json({
                    success: false,
                    msg: 'Club already registered.',
                    error: err
                });
            }
            res.json({
                success: true,
                message: 'Successfuly updated Club.'
            });
        });

    },

    deactiveClub: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else if (decoded._doc.role != 1) {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permissions to do this action.'
                    });
                } else {
                    Club.update({ _id: req.body.id }, {
                        $set: {
                            activated: false
                        }
                    }, { upsert: true }, function (err) {
                        if (err) {
                            res.status(409);
                            return res.json({
                                success: false,
                                msg: 'Club updation failed.',
                                error: err
                            });
                        }
                        // const fs = require('fs');
                        // fs.unlink("./public" + req.body.logo, (err) => {
                        //     if (err) throw err;
                        //     console.log('successfully deleted logo');
                        // });

                        res.json({
                            success: true,
                            message: 'Successfuly updated Club.'
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

}