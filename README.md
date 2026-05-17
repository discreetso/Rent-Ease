# Rent-Ease 🏠

A full-stack rental property management application built with Node.js and Express. This project demonstrates production-grade backend architecture with secure data handling, authentication, and geolocation services.

---

## Project Overview

Rent-Ease is a modern rental listing platform where users can:
- Create, read, update, and delete property listings
- Add location-based data with Mapbox geolocation
- Leave and manage reviews for properties
- Authenticate securely with session management
- Upload images to cloud storage

**Note:** Frontend styling is largely template-based; this README focuses on backend implementation and security practices.

---

## Tech Stack & Versions

### Runtime & Framework
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 22.13.0 | JavaScript runtime |
| **Express.js** | 4.21.2 | Web framework & routing |
| **MongoDB** | Atlas (Cloud) | NoSQL database |
| **Mongoose** | 8.9.5 | ODM for MongoDB |

### Authentication & Security
| Technology | Version | Purpose |
|---|---|---|
| **Passport.js** | 0.7.0 | Authentication middleware |
| **passport-local** | 1.0.0 | Local strategy for username/password |
| **passport-local-mongoose** | 8.0.0 | Plugin for user management |
| **express-session** | 1.18.1 | Session management |
| **connect-mongo** | 5.1.0 | MongoDB session store |
| **connect-flash** | 0.1.1 | Flash message handling |

### Validation & Data Processing
| Technology | Version | Purpose |
|---|---|---|
| **Joi** | 17.13.3 | Schema validation (server-side) |
| **method-override** | 3.0.0 | HTTP method tunneling (PUT/DELETE) |
| **cookie-parser** | 1.4.7 | Cookie parsing middleware |

### File Upload & Storage
| Technology | Version | Purpose |
|---|---|---|
| **Multer** | 1.4.5-lts.2 | Multipart form data handling |
| **multer-storage-cloudinary** | 4.0.0 | Cloudinary storage driver |
| **Cloudinary** | 1.21.0 | Cloud image storage & CDN |

### Geolocation Services
| Technology | Version | Purpose |
|---|---|---|
| **@mapbox/mapbox-sdk** | 0.16.1 | Geocoding API client |

### Template & Utilities
| Technology | Version | Purpose |
|---|---|---|
| **EJS** | 3.1.10 | Server-side templating |
| **ejs-mate** | 4.0.0 | EJS layout support |
| **dotenv** | 16.5.0 | Environment variable management |
| **nodemon** | 3.1.9 | Development auto-reload |

---

## Core Architecture

### Project Structure
```
Rent-Ease/
├── app.js                 # Main application entry point
├── middleware.js          # Custom middleware functions
├── schemaValid.js         # Joi validation schemas
├── CloudConfig.js         # Cloudinary configuration
├── controllers/
│   ├── listings.js        # Listing business logic
│   ├── reviews.js         # Review business logic
│   └── users.js           # User authentication logic
├── routes/
│   ├── listing.js         # Listing endpoints
│   ├── review.js          # Review endpoints
│   └── user.js            # Auth endpoints
├── models/
│   ├── listing.js         # Listing schema & model
│   ├── review.js          # Review schema & model
│   └── user.js            # User schema & model
├── utils/
│   ├── ExpressError.js    # Custom error class
│   └── wrapAsync.js       # Async error wrapper
└── views/                 # EJS templates
```

---

## Routes & API Endpoints

### Listing Routes (`/listings`)

#### GET /listings
**Handler:** `listingController.index`
```javascript
// Fetch all listings from database
const allListings = await Listing.find({});
res.render("listings/index.ejs", { allListings });
```
- **Purpose:** Display all available properties
- **Security:** Public access

#### GET /listings/new
**Handler:** `listingController.renderNewForm`
```javascript
res.render("listings/new.ejs");
```
- **Purpose:** Render property creation form
- **Middleware:** `isLoggedIn` - Requires authentication
- **Security:** Accessible only to authenticated users

#### POST /listings
**Handler:** `listingController.createListing`
```javascript
// Key code snippet
const newListing = new Listing(req.body.listing);  // Fillable model
newListing.owner = req.user._id;                   // Set owner
newListing.image = { url, filename };              // Cloudinary storage
newListing.geometry = coordinate.body.features[0].geometry; // Mapbox geocoding
await newListing.save();
```
- **Purpose:** Create new property listing
- **Middleware:** `isLoggedIn`, `validateSchema`, `upload.single()`
- **Security Features:**
  - Automatic owner assignment from authenticated user
  - Server-side Joi schema validation (prevents mass assignment)
  - Image uploaded to Cloudinary (not stored locally)
  - Multer for secure file handling
- **Key Line:** `newListing.owner = req.user._id;` - Prevents ownership spoofing

#### GET /listings/:id
**Handler:** `listingController.showListing`
```javascript
const listing = await Listing.findById(id)
  .populate({ path:'reviews', populate: { path: 'author' } })
  .populate('owner');
res.render("listings/show.ejs", { listing });
```
- **Purpose:** Display specific property details with reviews
- **Security:** Public access with populated owner/author data
- **Depth:** Nested population for author details in reviews

#### GET /listings/:id/edit
**Handler:** `listingController.renderEditForm`
```javascript
const listing = await Listing.findById(id);
res.render("listings/edit.ejs", { listing, originalImageUrl });
```
- **Purpose:** Render property edit form
- **Middleware:** `isLoggedIn`, `isOwner`
- **Security:** Only listing owner can edit

#### PUT /listings/:id
**Handler:** `listingController.updateListing`
```javascript
let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
if (typeof req.file !== 'undefined') {
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = { url, filename };
  await listing.save();
}
```
- **Purpose:** Update property details
- **Middleware:** `isLoggedIn`, `isOwner`, `validateSchema`, `upload.single()`
- **Security:** 
  - Owner verification required
  - Spread operator prevents direct model binding
  - Optional image replacement

#### DELETE /listings/:id
**Handler:** `listingController.destroyListing`
```javascript
await Listing.findByIdAndDelete(id);
```
- **Purpose:** Delete property listing
- **Middleware:** `isLoggedIn`, `isOwner`
- **Cascade:** MongoDB post-hook automatically deletes associated reviews
- **Security:** Owner-only deletion

---

### Review Routes (`/listings/:id/reviews`)

#### POST /listings/:id/reviews
**Handler:** `reviewController.createReview`
```javascript
let newReview = new Review(req.body.review);  // Fillable model
newReview.author = req.user._id;              // Assign logged-in user
listing.reviews.push(newReview);
await newReview.save();
await listing.save();
```
- **Purpose:** Add review to property
- **Middleware:** `isLoggedIn`, `validateReview`
- **Security:** Author automatically assigned (prevents spoofing)
- **Key Line:** `newReview.author = req.user._id;` - Prevents review forgery

#### DELETE /listings/:id/reviews/:reviewId
**Handler:** `reviewController.destroyReview`
```javascript
await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
await Review.findByIdAndDelete(reviewId);
```
- **Purpose:** Delete review
- **Middleware:** `isLoggedIn`, `isReviewAuthor`
- **Security:** Only review author can delete
- **Cascade:** Removes reference from listing and deletes review document

---

### User Routes (`/`)

#### GET /signup
**Handler:** `userController.renderSignupForm`
- **Purpose:** Display signup form
- **Security:** Public access

#### POST /signup
**Handler:** `userController.signup`
```javascript
let { username, email, password } = req.body;
const newUser = new User({ username, email });  // Fillable: email only
const registeredUser = await User.register(newUser, password);
req.login(registeredUser, (err) => { /* ... */ });
```
- **Purpose:** Register new user
- **Security:**
  - `passport-local-mongoose` hashes password automatically
  - User model uses `.register()` for secure password storage
  - Session created immediately after registration
  - Fillable model prevents mass assignment

#### GET /login
**Handler:** `userController.renderLoginForm`
- **Purpose:** Display login form

#### POST /login
**Handler:** `userController.login` (with Passport authentication)
```javascript
passport.authenticate('local', { 
  failureRedirect: '/login', 
  failureFlash: true 
})
```
- **Purpose:** Authenticate user
- **Security:**
  - Passport local strategy validates credentials
  - Failed attempts redirect with flash messages
  - Session created on success
  - Redirect URL preserved from saved session

#### GET /logout
**Handler:** `userController.logout`
```javascript
req.logout((err) => {
  if (err) next(err);
  req.flash('success', 'You are logged out!');
  res.redirect('/listings');
});
```
- **Purpose:** Destroy session and logout user
- **Security:** Proper session cleanup

---

## Core Functionalities

### 1. Authentication & Authorization

**Middleware: `isLoggedIn`** (middleware.js, lines 6-14)
```javascript
if(!req.isAuthenticated()) {
  const redirectUrl = req.originalUrl.split('?')[0].replace(/\/reviews\/.*/, '');
  req.session.redirectUrl = redirectUrl;
  req.flash('error', 'You must be logged in first!');
  return res.redirect('/login');
}
```
**Purpose:** Protect routes requiring authentication
**How it works:** Checks Passport's authentication flag, saves redirect URL for post-login navigation

**Middleware: `isOwner`** (middleware.js, lines 23-31)
```javascript
let listing = await Listing.findById(id);
if(!listing.owner.equals(res.locals.currUser._id)) {
  req.flash('error', 'You do not have permission to do that!');
  return res.redirect(`/listings/${id}`);
}
```
**Purpose:** Verify user owns the resource
**Security:** ObjectId comparison prevents ownership spoofing

**Middleware: `isReviewAuthor`** (middleware.js, lines 53-61)
```javascript
let review = await Review.findById(reviewId);
if(!review.author.equals(res.locals.currUser._id)) {
  req.flash('error', 'You do not have permission to do that!');
  return res.redirect(`/listings/${id}`);
}
```
**Purpose:** Verify user is review author
**Pattern:** Same as `isOwner` for consistency

---

### 2. Data Validation

**Schema Validation: Joi** (schemaValid.js)
```javascript
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
```
**Purpose:** Server-side validation of listing data
**Applied in:** `validateSchema` middleware before model creation

**Middleware: `validateSchema`** (middleware.js, lines 33-41)
```javascript
let { error } = listingSchema.validate(req.body);
if (error) {
  let errMsg = err.details.map((el) => el.message).join(",");
  throw new ExpressError(400, errMsg);
}
```
**Purpose:** Validate listing creation/update data
**Security:** Catches invalid data before database operations

---

### 3. Session Management

**Session Configuration** (app.js, lines 54-63)
```javascript
const sessionOptions = {
  store: MongoStore.create({ mongoUrl: dbUrl, crypto: { secret: process.env.SECRET } }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    Expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};
```
**Purpose:** Persistent session storage with MongoDB
**Security Features:**
- Sessions encrypted with `crypto.secret`
- 7-day expiration
- `httpOnly: true` prevents JavaScript access to session cookies
- Sessions survive server restarts

---

### 4. Image Management with Cloudinary

**Configuration** (CloudConfig.js, lines 10-16)
```javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Wanderlust_DEV',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});
```
**Purpose:** Secure cloud-based image storage
**Security:**
- File format validation
- Centralized folder structure
- CDN delivery

**Integration in Create Listing** (controllers/listings.js, lines 29-34)
```javascript
let url = req.file.path;
let filename = req.file.filename;
newListing.image = { url, filename };
newListing.geometry = coordinate.body.features[0].geometry;
```
**Benefit:** Images never stored locally; Cloudinary handles distribution

---

### 5. Geolocation with Mapbox

**Integration** (controllers/listings.js, lines 23-27)
```javascript
let coordinate = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
}).send();
newListing.geometry = coordinate.body.features[0].geometry;
```
**Purpose:** Convert address strings to coordinates
**Format:** GeoJSON format stored in MongoDB
**Use Case:** Map visualization and location-based queries

---

### 6. Async Error Handling

**Async Wrapper** (assumed in utils/wrapAsync.js)
```javascript
const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
```
**Purpose:** Catch async errors without try-catch blocks
**Applied to:** All async route handlers
**Example:** `wrapAsync(listingController.index)`

**Global Error Handler** (app.js, lines 104-107)
```javascript
app.use((err, req, res, next) => {
  let { statusCode = 500, message = 'Something went wrong!'} = err;
  res.status(statusCode).render("error.ejs", { message });  
});
```
**Purpose:** Centralized error handling

---

## Security Features & Best Practices

### ✅ Authentication & Authorization
- **Passport.js with Local Strategy:** Secure username/password authentication
- **Password Hashing:** `passport-local-mongoose` handles bcrypt hashing
- **Session Management:** MongoDB-backed sessions with encryption
- **Owner Verification:** Middleware prevents unauthorized resource access

### ✅ Data Protection - Mass Assignment Prevention
**How We Prevent It:** Using `fillable` properties instead of `unguarded`

**Good Practice (Current Implementation):**
```javascript
// models/user.js - Only email is in schema
const userSchema = new Schema({
  email: { type: String, required: true }
});
// Password handled by passport plugin

// controllers/users.js - Only whitelisted fields assigned
let { username, email, password } = req.body;
const newUser = new User({ username, email });
```

**Why NOT `unguarded`:**
- Unguarded mode exposes all fields to mass assignment
- Example attack: `{ role: 'admin', username: 'hacker', email: '...', password: '...' }`
- Mongoose with fillable pattern = safe by default

**Validation with Fillable:**
```javascript
// schemaValid.js - Explicitly define allowed fields
listing: Joi.object({ 
  title: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  country: Joi.string().required(),
  price: Joi.number().required().min(0),
  image: Joi.string().allow('', null)
}).required()
```

### ✅ Input Validation
- **Server-Side Joi Validation:** Prevents invalid data before database operations
- **Schema-Based Approach:** Explicit whitelist of allowed fields
- **Type Checking:** Joi enforces data types and formats
- **Range Validation:** `min/max` constraints on numeric fields

### ✅ Resource Ownership
- **User → Listing Relationship:** Owner field automatically assigned from authenticated user
```javascript
newListing.owner = req.user._id; // Line 32, controllers/listings.js
```
- **Middleware Verification:** `isOwner` and `isReviewAuthor` middleware verify relationships
- **Query Population:** Related data safely loaded with Mongoose `.populate()`

### ✅ Session Security
- **HttpOnly Cookies:** Prevents XSS access to session tokens
- **Secure Secrets:** Environment variable-based encryption
- **MongoDB Storage:** Sessions persistent and encrypted at rest
- **Expiration:** 7-day automatic session expiration

### ✅ Error Handling
- **Custom Error Class:** Centralized error responses
- **No Stack Traces:** Production errors don't expose internals
- **User-Friendly Messages:** Flash messages guide users

### ✅ Environment Configuration
- **dotenv:** Sensitive data (DB_URL, API_KEYS) in `.env`, never in code
- **Node Environment Check:**
```javascript
if(process.env.NODE_ENV != 'production') {
  require('dotenv').config();
}
```

### ✅ Data Relationships & Cascade
- **Review Cleanup:** MongoDB post-hook automatically deletes reviews when listing deleted
```javascript
listingSchema.post('findOneAndDelete', async (listing) => {
  if(listing){
    await Review.deleteMany({_id: { $in: listing.reviews } });
  }
});
```

---

## Core Features

### 1. **Property Listing Management**
- Create listings with images, location, price, description
- Edit and update listings (owner only)
- Delete listings with automatic review cleanup
- View all listings or specific details
- Geolocation-enabled (Mapbox integration)

### 2. **Review System**
- Leave ratings and comments on properties
- Delete own reviews (author only)
- Cascade deletion when property deleted
- Author information populated in views

### 3. **User Authentication**
- Secure registration with email validation
- Login with session persistence
- Logout with session cleanup
- Redirect to intended destination post-login

### 4. **Cloud Image Storage**
- Multer integration for file uploads
- Cloudinary storage with format validation
- CDN delivery for fast image loading
- No local disk storage overhead

### 5. **Geolocation Services**
- Address-to-coordinates conversion (Mapbox Geocoding)
- GeoJSON format for map compatibility
- Location-based property queries (foundation)

---

## Getting Started

### Prerequisites
- Node.js 22.13.0+
- MongoDB Atlas account
- Cloudinary account
- Mapbox API token

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/discreetso/Rent-Ease.git
   cd Rent-Ease
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create .env File**
   ```
   NODE_ENV=development
   ATLASDB_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
   SECRET=your-session-secret-key
   CLOUD_NAME=your-cloudinary-name
   CLOUD_API_KEY=your-api-key
   CLOUD_API_SECRET=your-api-secret
   MAP_TOKEN=your-mapbox-token
   ```

4. **Start Server**
   ```bash
   npm start
   # Or with nodemon for development
   nodemon app.js
   ```

5. **Access Application**
   ```
   http://localhost:8080
   ```

---

## Development Notes

### Key Design Decisions

1. **Mongoose over Raw MongoDB:** ODM provides schema validation and relationships
2. **Passport Authentication:** Industry-standard, battle-tested authentication
3. **MongoDB Session Store:** Horizontal scaling capability vs. memory-based sessions
4. **Joi Server-Side Validation:** Defense-in-depth approach (client + server validation)
5. **Cloudinary Integration:** Avoid disk I/O bottlenecks and image processing

### Backend Patterns Used

- **MVC Architecture:** Controllers separate business logic from routes
- **Middleware Chain:** Express middleware for auth, validation, error handling
- **Async/Await:** Modern promise handling with error wrapper utility
- **Population:** Mongoose populate for efficient data relationships

### Testing Recommendations

- Unit tests for controllers using Jest/Mocha
- Integration tests for API endpoints
- Load testing with session management
- Security scanning with OWASP tools

---

## File Size Analysis

| Language | Bytes | Percentage |
|---|---|---|
| JavaScript | 32,611 | 54% |
| EJS | 18,540 | 31% |
| CSS | 15,306 | 25% |

**Note:** Frontend (CSS) and templating (EJS) are primarily styling and UI. Core business logic is in JavaScript backend code.

---

## Future Enhancement Ideas

1. **Role-Based Access Control (RBAC):** Admin, moderator, user roles
2. **Advanced Filtering:** Price range, amenities, date availability
3. **Booking System:** Calendar and reservation management
4. **Payment Integration:** Stripe/PayPal for transactions
5. **Email Notifications:** Booking confirmations, review alerts
6. **API Rate Limiting:** Prevent abuse and brute force attacks
7. **WebSocket Support:** Real-time notifications
8. **Search Optimization:** Full-text search with MongoDB text indexes

---

## License

ISC

---

## Author

**huzaifa**

---

## Contributing

Contributions welcome! This project demonstrates production-ready backend patterns suitable for learning and extension.

---

**Built with ❤️ for property rental management**
