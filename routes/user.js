const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware.js');
const userController = require('../controllers/users.js');

router.route('/signup')
.get( userController.renderSignupForm ) // render the signup form
.post( wrapAsync(userController.signup) ); // handle the signup form submission

router.route('/login')
.get( userController.renderLoginForm ) // render the login form
.post( saveRedirectUrl, 
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), 
    userController.login ); // handle the login form submission

// logout route
router.get('/logout', userController.logout); 

module.exports = router;