const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();
const app = express();

//Running middleware
app.use(express.json());

const PORT = process.env.PORT || 3000;

//Routes

async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer();
