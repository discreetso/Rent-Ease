const mongoose = require('mongoose');
const Listing = require('../models/listing.js');
const initData = require('./data.js');

// MongoDB Connection
Mongo_Url = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => console.log("MongoDB Connected!"))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(Mongo_Url);
};

const initDb = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: '67f7b957167eaa31affee9ed'}));
    await Listing.insertMany(initData.data);
    console.log("Data initialized!");
};

initDb();