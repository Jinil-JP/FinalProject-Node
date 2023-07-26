const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
});

userSchema.statics.getNextId = async function () {
  try {
    const lastUser = await this.findOne({}, { userId: 1 }).sort({ userId: -1 });
    return lastUser ? lastUser.userId + 1 : 1;
  } catch (error) {
    console.error("Error getting next ID:", error.message);
    throw error; // Rethrow the error to handle it in the caller function
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
