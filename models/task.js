const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskId: {
    type: Number,
    unique: true,
    required: true,
  },
  taskName: {
    type: String,
    required: true,
  },
  taskDescription: {
    type: String,
    required: true,
  },
  taskStartDate: {
    type: Date,
    required: true,
  },
  taskEndDate: {
    type: Date,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isPrerequisite: {
    type: Boolean,
    default: false,
  },
  hoursWorked: {
    type: Number,
    default: 0,
  },
  selectedMemberId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

taskSchema.statics.getNextId = async function () {
  try {
    const lastTask = await this.findOne({}, { taskId: 1 }).sort({ taskId: -1 });
    return lastTask ? lastTask.taskId + 1 : 1;
  } catch (error) {
    console.error("Error getting next ID:", error.message);
    throw error; // Rethrow the error to handle it in the caller function
  }
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
