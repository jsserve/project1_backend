var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();

//Models
var User = require("../models/user");
var Video = require("../models/video");
var Club = require("../models/club");

//UsersRoutes
var userCtrl = require('./../controllers/users.js');
router.route('/user/signup').post(userCtrl.signUp);
router.route('/user/signin').post(userCtrl.signIn);
router.route('/user/permissions').get(userCtrl.checkIfUserIsAdmin);
router.route('/user/fetchAll').get(userCtrl.getUsers);
router.route('/user/fetchUnApprovedUsers').get(userCtrl.fetchUnApprovedUsers);
router.route('/user/deleteSelectedUser').get(userCtrl.deleteSelectedUser);
router.route('/user/fetchUser').get(userCtrl.fetchUser);
router.route('/user/getEditUser').get(userCtrl.getEditUser);
router.route('/user/activateUser').get(userCtrl.activateUser);
router.route('/user/deactivateUser').get(userCtrl.deactivateUser);
router.route('/user/updateprofile').post(userCtrl.updateProfile);
router.route('/user/changePassword').post(userCtrl.changePassword);
router.route('/user/fetchallbyclub').get(passport.authenticate('jwt', { session: false }), userCtrl.getAllUsersByClubId);


//VideoRoutes
var videosCtrl = require('./../controllers/videos.js');
router.route('/video/upload').post(passport.authenticate('jwt', { session: false }), videosCtrl.uploadVideo);
router.route('/video/edit').put(passport.authenticate('jwt', { session: false }), videosCtrl.updateVideo);
router.route('/video/fetchAll').get(passport.authenticate('jwt', { session: false }), videosCtrl.getVideos);
router.route('/video/getById').get(passport.authenticate('jwt', { session: false }), videosCtrl.getVideoById);
router.route('/video/deleteById').get(passport.authenticate('jwt', { session: false }), videosCtrl.deleteVideoById);
router.route('/video/assignUsers').post(passport.authenticate('jwt', { session: false }), videosCtrl.assignUsers);
router.route('/video/getVideosClub').get(passport.authenticate('jwt', { session: false }), videosCtrl.getVideosClub);

//TrackingDataRoutes
var trackingDataCtrl = require('./../controllers/tracking_data.js');
router.route('/trackingData/upload').post(passport.authenticate('jwt', { session: false }), trackingDataCtrl.uploadTrackingData);
router.route('/trackingData/getForVideo').get(passport.authenticate('jwt', { session: false }), trackingDataCtrl.getTrackingDataForVideo);
router.route('/trackingData/deleteById').get(passport.authenticate('jwt', { session: false }), trackingDataCtrl.deleteById);

//ClubRoutes
var clubsCtrl = require('./../controllers/clubs.js');

router.route('/club/fetchAll').get(clubsCtrl.getAllClubs);
router.route('/club/fetchAllUnActivated').get(passport.authenticate('jwt', { session: false }), clubsCtrl.getRequestedClubs);
router.route('/club/fetchAllActivated').get(clubsCtrl.getClubs);
router.route('/club/activate').post(passport.authenticate('jwt', { session: false }), clubsCtrl.activateClub);
router.route('/club/getBySlug').get(clubsCtrl.getClubBySlug);
router.route('/club/delete').delete(passport.authenticate('jwt', { session: false }), clubsCtrl.deleteClub);
router.route('/club/checkClubActive').get(passport.authenticate('jwt', { session: false }), clubsCtrl.checkClubActive);
router.route('/club/create').post(clubsCtrl.createClub);
router.route('/club/addandapprove').post(passport.authenticate('jwt', { session: false }), clubsCtrl.addAndActivateClub);
router.route('/club/updateClubwithoutLogo').post(passport.authenticate('jwt', { session: false }), clubsCtrl.updateClubwithoutLogo);
router.route('/club/deactive').post(passport.authenticate('jwt', { session: false }), clubsCtrl.deactiveClub);

//EventRoutes
var eventsCtrl = require('./../controllers/event.js');
router.route('/eventData/getEventDetails').post(eventsCtrl.getEventDetails);
router.route('/eventData/shareEvent').post(eventsCtrl.shareEvent);
router.route('/eventData/getEventsByVideo').post(eventsCtrl.getEventsByVideo);

//playlistRoutes
var playlistCtrl = require('./../controllers/playlist.js');

router.route('/playlist/fetchPlaylistData').get(passport.authenticate('jwt', { session: false }), playlistCtrl.fetchPlaylistData);
router.route('/playlist/fetchAll').get(passport.authenticate('jwt', { session: false }), playlistCtrl.fetchPlaylist);
router.route('/playlist/getById').get(passport.authenticate('jwt', { session: false }), playlistCtrl.getVideoById);
router.route('/playlist/create').post(playlistCtrl.createPlaylist);
router.route('/playlist/updatePlaylist').post(playlistCtrl.updatePlaylist);
router.route('/playlist/assignUsers').post(passport.authenticate('jwt', { session: false }), playlistCtrl.assignUsers);
router.route('/playlist/deletePlaylist').post(passport.authenticate('jwt', { session: false }), playlistCtrl.deletePlaylist);

//teams 
var teamsCtrl = require('./../controllers/teams.js');

router.route('/team/create').post(passport.authenticate('jwt', { session: false }), teamsCtrl.createTeam);
router.route('/team/fetchAll').get(passport.authenticate('jwt', { session: false }), teamsCtrl.getAllTeams);
router.route('/team/delete').delete(passport.authenticate('jwt', { session: false }), teamsCtrl.deleteTeam);
router.route('/team/update').post(passport.authenticate('jwt', { session: false }), teamsCtrl.updateTeam);

module.exports = router;