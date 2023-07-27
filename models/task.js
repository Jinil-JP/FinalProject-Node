const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskId: {
    type: Number,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isStarted: {
    type: Boolean,
    default: false,
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
    type: Number,
    required: true,
  },
  taskStartTime: {
    type: Date,
    required: false,
  },
  taskEndTime: {
    type: Date,
    required: false,
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
