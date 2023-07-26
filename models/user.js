const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: {
    type: Number,
    unique: true,
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
    const lastUser = await this.findOne({}, { _id: 1 }).sort({ _id: -1 });
    return lastUser ? lastUser._id + 1 : 1;
  } catch (error) {
    console.error("Error getting next ID:", error.message);
    throw error; // Rethrow the error to handle it in the caller function
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
