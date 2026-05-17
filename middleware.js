const Listing = require('./models/listing');
const Review = require('./models/review');
const ExpressError = require('./utils/ExpressError');
const { listingSchema, reviewSchema } = require('./schemaValid.js');

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        const redirectUrl = req.originalUrl.split('?')[0].replace(/\/reviews\/.*/, '');
        req.session.redirectUrl = redirectUrl;
        req.flash('error', 'You must be logged in first!');
        return res.redirect('/login');
      };
      next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if(!listing.owner.equals(res.locals.currUser._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.validateSchema = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = err.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
      let errMsg = err.details.map((el) => el.message).join(",");
      throw new ExpressError(400, errMsg);
    } else {
      next();
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if(!review.author.equals(res.locals.currUser._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/listings/${id}`);
  }
  next();
};
