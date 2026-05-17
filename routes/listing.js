const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateSchema } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require('../CloudConfig.js')
const upload = multer({ storage });

router.route('/')
.get( wrapAsync(listingController.index) )  //index route
.post( isLoggedIn, upload.single('listing[image]'), validateSchema, wrapAsync(listingController.createListing) ); //create route

//New Form Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

//Edit Form Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

router.route('/:id')
.get( wrapAsync(listingController.showListing) ) //show route
.put( isLoggedIn, isOwner, upload.single('listing[image]'), validateSchema, wrapAsync(listingController.updateListing) ) //update route
.delete( isLoggedIn, isOwner, wrapAsync(listingController.destroyListing) ); //destroy route

module.exports = router;
