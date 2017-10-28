var User = require("../models/user");
var jwt = require('jsonwebtoken');
var config = require('../config/database');
var passport = require('passport');
var crypto = require('crypto');
var User = require("../models/user");
var bcrypt = require('bcrypt-nodejs');
require('../config/passport')(passport);

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
module.exports = {
    updateProfile: function (req, res) {
        if (!req.body.email || !req.body.firstName || !req.body.lastName || !req.body.clubFunction || !req.body.phone || !req.body.teams) {
            res.status(422);
            res.json({
                success: false,
                message: 'Missing required fields!'
            });
        } else {
            var clientUser = req.body;
            // console.log(clientUser)
            // var newUser = new User(clientUser);


            User.update({ _id: clientUser._id }, { $set: { phone: clientUser.phone, email: clientUser.email, firstName: clientUser.firstName, lastName: clientUser.lastName, club: clientUser.club, clubFunction: clientUser.clubFunction, role: clientUser.role, teams: req.body.teams } }, { upsert: true }, function (err) {
                if (err) {
                    res.status(409);
                    return res.json({
                        success: false,
                        message: 'Profile update failed.'
                    });
                }
                res.json({
                    success: true,
                    message: 'Profile Updated Successfully.'
                });

            });
            // save the user
            // newUser.updateOne({'_id':clientUser._id},function (err) {
            //     if (err) {
            //         res.status(409);
            //         return res.json({
            //             success: false,
            //             message: 'Email already registered.'
            //         });
            //     }
            //     res.json({
            //         success: true,
            //         message: 'Profile Updated Successfully.'
            //     });
            // });
        }
    },
    signUp: function (req, res) {
        if (!req.body.password || !req.body.email || !req.body.firstName || !req.body.lastName || !req.body.club || !req.body.clubFunction || !req.body.phone || !req.body.role) {
            res.status(422);
            res.json({
                success: false,
                message: 'Missing required fields!'
            });
        } else {
            var clientUser = req.body;
            var newUser = new User(clientUser);
            // save the user
            newUser.save(function (err) {
                if (err) {
                    res.status(409);
                    return res.json({
                        success: false,
                        message: 'Email already registered.'
                    });
                }
                res.json({
                    success: true,
                    message: 'Successful created new user.'
                });
            });
        }
    },
    signIn: function (req, res) {
        User.findOne({
            email: req.body.email
        }, function (err, user) {
            if (err) throw err;

            if (!user) {
                res.status(401);
                res.send({
                    success: false,
                    message: 'Authentication failed. User not found.'
                });
            } else {
                // check if password matches
                if (user.activate) {

                    user.comparePassword(req.body.password, function (err, isMatch) {
                        console.log(err);
                        if (isMatch && !err) {
                            // if user is found and password is right create a token
                            var token = jwt.sign(user, config.secret);
                            // return the information including token as JSON
                            res.json({
                                success: true,
                                token: 'JWT ' + token,
                                user: user
                            });
                        } else {
                            res.status(401);
                            res.send({
                                success: false,
                                message: 'Authentication failed.'
                            });
                        }
                    });

                } else {


                    res.status(401);
                    res.send({
                        success: false,
                        message: 'This account is deactivated. Please contact your administrator for details.'
                    });
                }
            }
        });
    },
    checkIfUserIsAdmin: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    if (decoded._doc.role == 1 || decoded._doc.role == 2) {
                        return res.status(200).json({
                            success: true,
                            message: 'User is admin.',
                            admin: true

                        });
                    }
                    // else if (decoded._doc.coach) {
                    //     return res.json({
                    //         success: false,
                    //         message: 'User is coach.',
                    //         coach: true
                    //     });
                    // }
                    else {

                        return res.status(403).json({
                            success: false,
                            message: 'User not admin.'
                        });
                    }
                }
            });
        } else {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized.'
            });
        }
    },
    fetchUser: function (req, res, next) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {

                var query = decoded._doc._id;

                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {

                    // User.find({}).populate('clubs','name').exec(function (err, Users) {
                    User.findOne({ '_id': query }).populate('club', 'name').exec(function (err, Users) {
                        if (err) return next(err);
                        console.log('Users', Users.club)
                        res.json(Users);
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
    getUsers: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    var loggedInUserId = req.query.loggedInUserId;
                    if (decoded._doc.role == 1) {
                        User.find({ $and: [{ "_id": { $ne: loggedInUserId } }, { "activate": true }] }, function (err, Users) {
                            if (err) return next(err);
                            res.json(Users);
                        });
                    }
                    else if (decoded._doc.role == 2 || decoded._doc.role == 2 || decoded._doc.role == 4) {
                        User.find({ $and: [{ "_id": { $ne: loggedInUserId } }, { "role": { $ne: 1 } }, { "club": decoded._doc.club }, { "activate": true }] }, function (err, Users) {
                            if (err) return next(err);
                            res.json(Users);
                        });
                    } else {
                        User.find({ $and: [{ "_id": { $ne: loggedInUserId } }, { "role": { $ne: 1 } }, { "club": decoded._doc.club }, { "activate": true }] }, function (err, Users) {
                            if (err) return next(err);
                            res.json(Users);
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
    fetchUnApprovedUsers: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    var loggedInUserId = req.query.loggedInUserId;
                    if (decoded._doc.role == 1) {
                        User.find({ $and: [{ "_id": { $ne: loggedInUserId } }, { "activate": false }] }, function (err, Users) {
                            if (err) return next(err);
                            res.json(Users);
                        });
                    } else {
                        User.find({ $and: [{ "_id": { $ne: loggedInUserId } }, { "role": { $ne: 1 } }, { "club": decoded._doc.club }, { "activate": false }] }, function (err, Users) {
                            if (err) return next(err);
                            res.json(Users);
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

    deleteSelectedUser: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    var selectedUser = req.query.id;
                    User.findOneAndRemove({ _id: selectedUser }, function (err, Users) {
                        return res.status(200).json({
                            success: true,
                            message: 'User deleted Successfully.'
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

    getEditUser: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                console.log('object' + decoded._doc._id);
                var query = decoded._doc._id;

                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {

                    var editSelectedUser = req.query.id;
                    User.findOne({ '_id': editSelectedUser }, function (err, Users) {
                        if (err) return next(err);
                        res.json(Users);
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

    activateUser: function (req, res) {
        var token = getToken(req.headers);

        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                console.log('object' + decoded._doc._id);
                var query = decoded._doc._id;

                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    var editSelectedUser = req.query.id;
                    User.update({ _id: editSelectedUser }, { $set: { activate: "true" } },
                        { upsert: true },
                        function (err) {
                            if (err) {
                                res.status(409);
                                return res.json({
                                    success: false,
                                    message: 'User activation failed.'
                                });
                            }
                            res.json({
                                success: true,
                                message: 'User activated Successfully.'
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


    deactivateUser: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                console.log('object' + decoded._doc._id);
                var query = decoded._doc._id;

                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    var editSelectedUser = req.query.id;
                    User.update({ _id: editSelectedUser }, { $set: { activate: "false" } },
                        { upsert: true },
                        function (err) {
                            if (err) {
                                res.status(409);
                                return res.json({
                                    success: false,
                                    message: 'User deactivation failed.'
                                });
                            }
                            res.json({
                                success: true,
                                message: 'User deactivated Successfully.'
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

    changePassword: function (req, res) {
        User.findOne({
            _id: req.body._id
        }, function (err, user) {
            if (err) throw err;

            if (!user) {
                res.status(401);
                res.send({
                    success: false,
                    message: 'Authentication failed. User not found.'
                });
            } else {
                // check if password matches
                if (user.activate) {
                    if (req.body.backoffice) {
                        bcrypt.genSalt(10, function (err, salt) {
                            if (err) {
                                return next(err);
                            }
                            bcrypt.hash(req.body.newpassword, salt, null, function (err, hash) {
                                if (err) {
                                    return next(err);
                                }
                                newpassword = hash;
                                User.update({ _id: req.body._id }, { $set: { password: newpassword } }, { upsert: true }, function (err) {
                                    if (err) {
                                        res.status(409);
                                        return res.json({
                                            success: false,
                                            message: 'Password changed failed.'
                                        });
                                    }
                                    res.json({
                                        success: true,
                                        message: 'Password changed successfully.'
                                    });

                                });
                            });
                        });
                    }
                    else {
                        user.comparePassword(req.body.oldpassword, function (err, isMatch) {
                            if (isMatch && !err) {

                                bcrypt.genSalt(10, function (err, salt) {
                                    if (err) {
                                        return next(err);
                                    }
                                    bcrypt.hash(req.body.newpassword, salt, null, function (err, hash) {
                                        if (err) {
                                            return next(err);
                                        }

                                        newpassword = hash;
                                        User.update({ _id: req.body._id }, { $set: { password: newpassword } }, { upsert: true }, function (err) {
                                            if (err) {
                                                res.status(409);
                                                return res.json({
                                                    success: false,
                                                    message: 'Password changed failed.'
                                                });
                                            }
                                            res.json({
                                                success: true,
                                                message: 'Password changed successfully.'
                                            });
                                        });
                                    });
                                });

                            } else {
                                res.status(401);
                                res.send({
                                    success: false,
                                    message: 'Authentication failed.'
                                });
                            }
                        });
                    }


                } else {


                    res.status(401);
                    res.send({
                        success: false,
                        message: 'This account is deactivated. Please contact your administrator for details.'
                    });
                }
            }
        });
    },

    getAllUsersByClubId: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {

                    User.aggregate([
                        {
                            $lookup:
                            {
                                from: "clubs",
                                localField: "club",
                                foreignField: "_id",
                                as: "club"
                            }
                        },
                        {
                            $match: { $and: [{ "club._id": req.query.clubId.toObjectId() }, { "role": 5 }] }
                        }
                    ]).exec(function (err, Users) {
                        if (err) return next(err);
                        res.json(Users);
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