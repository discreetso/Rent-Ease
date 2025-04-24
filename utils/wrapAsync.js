// Description: This file contains the code that wraps the async function and works as a middleware to catch errors. This is a cleaner way to handle errors in the code. The wrapAsync function takes a function as an argument and returns a new function that calls the original function and catches any errors that occur. This way, we can avoid repeating the try-catch block in every route handler and keep the code clean and concise.

module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
}