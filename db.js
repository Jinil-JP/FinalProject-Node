// db.js
const mongoose = require("mongoose");
const User = require("./models/user");

async function connectToDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/final_project", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    const adminUser = await User.findOne({ email: "admin@admin.com" });
    if (!adminUser) {
      const nextId = await User.getNextId();

      const defaultAdminUser = new User({
        id: nextId,
        email: "admin@admin.com",
        password: "Admin@123",
        isAdmin: true,
        hourlyRate: 0,
      });

      // Save the user to the database
      await defaultAdminUser.save();
      console.log("Default admin user added to the database.");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectToDB();

module.exports = mongoose.connection;
