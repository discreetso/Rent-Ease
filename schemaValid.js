// Description: This file contains the schema validation for the listing model. It is used to validate the data that is being sent to the server. If the data is not valid, it will throw an error. This is used in the create and update routes to validate the data before saving it to the database. This is a good practice to ensure that the data is valid and prevent any errors in the application.
const Joi = require('joi');

module.exports.listingSchema = Joi.object({  
    listing: Joi.object({ 
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow('', null)
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required()
});