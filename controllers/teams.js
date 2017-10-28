var Team = require("../models/team");
var jwt = require('jsonwebtoken');
var config = require('../config/database');

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
    createTeam: function (req, res) {

        var newTeam = new Team({
            name: req.body.name
        });

        newTeam.save(function (err, newTeam) {
            if (err) {
                res.status(409);
                return res.json({
                    success: false,
                    msg: 'Team already exists.',
                    error: err
                });
            }
            res.json({
                success: true,
                message: 'Successfuly created new Team.',
                team: newTeam
            });
        });

    },

    getAllTeams: function (req, res) {
        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {

                    Team.find({}).exec(function (err, Teams) {
                        if (err) return next(err);
                        res.json(Teams);
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

    deleteTeam: function (req, res) {
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
                    Team.findByIdAndRemove(req.query.id, function (err, club) {
                        if (club) {
                            var response = {
                                message: "Team successfully deleted",
                                id: club._id
                            };
                        } else {
                            res.status(403);
                            var response = {
                                message: "Team not found"
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

    updateTeam: function (req, res) {

        var token = getToken(req.headers);
        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else if (decoded._doc.role != 1 || decoded._doc.role != 2) {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permissions to do this action.'
                    });
                } else {
                    Team.update({ _id: req.body.id }, { $set: { name: req.body.name } }, { upsert: true }, function (err) {
                        if (err) {
                            res.status(409);
                            return res.json({
                                success: false,
                                msg: 'Team already registered.',
                                error: err
                            });
                        }
                        res.json({
                            success: true,
                            message: 'Successfuly updated Team.'
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