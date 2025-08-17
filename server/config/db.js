require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect(
        `${process.env.MONGO_URI}/${process.env.DATABASE_NAME}`
    );
    console.log("MongoDB Connected");
};

module.exports = connectDB;
