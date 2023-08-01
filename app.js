// app.js
const express = require("express");
const bodyParser = require("body-parser");
const dbConnection = require("./db");
const User = require("./models/user");
const Task = require("./models/task");

const app = express();

// Middleware
app.use(bodyParser.json());

// Create a new user or add member
app.post("/create_user", async (req, res) => {
  try {
    const { name, email, password, isAdmin, hourlyRate } = req.body;

    const nextId = await User.getNextId();

    const user = new User({
      userId: nextId,
      name,
      email,
      password,
      isAdmin,
      hourlyRate,
    });

    await user.save();

    const userWithoutPassword = { ...user.toObject(), password: undefined };
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: "Error creating user" });
  }
});

// Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userWithoutPassword = { ...user.toObject(), password: undefined };
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

//get all members
app.get("/members", async (req, res) => {
  try {
    const members = await User.find({ isAdmin: false });

    const membersWithoutPassword = members.map((member) => ({
      ...member.toObject(),
      password: undefined,
    }));

    res.status(200).json(membersWithoutPassword);
  } catch (error) {
    console.error("Error fetching member list:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while fetching member list" });
  }
});

// Delete member
app.post("/delete_member", async (req, res) => {
  try {
    const memberId = req.body.id;

    const member = await User.findOne({ userId: memberId });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    await Task.deleteMany({ selectedMemberId: memberId });

    await User.deleteOne({ userId: memberId });
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error.message);
    res.status(500).json({ error: "Error deleting member" });
  }
});

// Create a new task
app.post("/create_task", async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      isPrerequisite,
      selectedMemberId,
    } = req.body;

    const selectedMember = await User.findOne({ userId: selectedMemberId });
    if (!selectedMember) {
      return res.status(400).json({ error: "Invalid selectedMemberId" });
    }

    const taskId = await Task.getNextId();

    const newTask = new Task({
      taskId: taskId,
      name: name,
      description: description,
      startDate: startDate,
      endDate: endDate,
      isStarted: false,
      isCompleted: false,
      isPrerequisite: isPrerequisite,
      hoursWorked: 0,
      selectedMemberId: selectedMemberId,
    });

    const savedTask = await newTask.save();

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error saving task:", error.message);
    res.status(500).json({ error: "Error creating task" });
  }
});

//tasks
app.post("/tasks", async (req, res) => {
  try {
    const userID = req.body.currentUserId;

    const user = await User.findOne({ userId: userID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let tasks;

    if (user.isAdmin) {
      tasks = await Task.find();
    } else {
      tasks = await Task.find({ selectedMemberId: userID });
    }

    const tasksWithSelectedMember = await Promise.all(
      tasks.map(async (task) => {
        const selectedMember = await User.findOne({
          userId: task.selectedMemberId,
        });
        if (!selectedMember) {
          return {
            ...task.toObject(),
            selectedMember: null,
          };
        }
        return {
          ...task.toObject(),
          selectedMember: selectedMember.toObject(),
        };
      })
    );

    res.status(200).json(tasksWithSelectedMember);
  } catch (error) {
    console.error("Error getting tasks:", error.message);
    res.status(500).json({ error: "Error getting tasks" });
  }
});

//Start task
app.post("/start_task", async (req, res) => {
  try {
    const { taskId } = req.body;

    const task = await Task.findOne({ taskId: taskId });
    if (!task) {
      return res.status(400).json({ error: "Invalid taskId" });
    }

    if (task.isStarted) {
      return res.status(400).json({ error: "Task is already started" });
    }

    const prerequisiteTasks = await Task.find({
      selectedMemberId: task.selectedMemberId,
      isPrerequisite: true,
      isCompleted: false,
      isStarted: true,
    });

    if (prerequisiteTasks.length > 0) {
      return res.status(400).json({
        error:
          "You cannot start this prerequisite task as there are pending tasks.",
      });
    }

    task.isStarted = true;
    task.taskStartTime = new Date();

    await task.save();

    res.status(200).json({ message: "Task started successfully" });
  } catch (error) {
    console.error("Error starting task:", error.message);
    res.status(500).json({ error: "Error starting task" });
  }
});

//Complete task
app.post("/complete_task", async (req, res) => {
  try {
    const { taskId, currentUserId } = req.body;

    const task = await Task.findOne({ taskId: taskId });
    if (!task) {
      return res.status(400).json({ error: "Invalid taskId" });
    }

    const currentUser = await User.findOne({ userId: currentUserId });

    const selectedMember = await User.findOne({
      userId: task.selectedMemberId,
    });

    if (!selectedMember) {
      return res.status(400).json({ error: "Invalid selectedMemberId" });
    }

    if (currentUser.isAdmin) {
      task.isStarted = true;
      task.taskStartTime = new Date();
    }

    if (!task.isStarted) {
      return res.status(400).json({ error: "Task is not yet started" });
    }

    if (task.isCompleted) {
      return res.status(400).json({ error: "Task is already completed" });
    }

    task.isCompleted = true;
    task.taskEndTime = new Date(); // Record the time of task completion

    // Calculate the hours worked by subtracting the task start time from the completion time
    const startTime = task.taskStartTime.getTime();
    const endTime = task.taskEndTime.getTime();
    const hoursWorked = (endTime - startTime) / (1000 * 60 * 60); // Convert milliseconds to hours
    task.hoursWorked = hoursWorked;

    const hourlyRate = selectedMember.hourlyRate;
    const totalCost = (hoursWorked * hourlyRate).toFixed(2);

    task.cost = totalCost;

    await task.save();

    res
      .status(200)
      .json({ message: "Task completed successfully", hoursWorked, totalCost });
  } catch (error) {
    console.error("Error completing task:", error.message);
    res.status(500).json({ error: "Error completing task" });
  }
});

// Delete a task
app.post("/delete_task", async (req, res) => {
  try {
    const taskId = req.body.id;

    await Task.deleteOne({ taskId: taskId });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error.message);
    res.status(500).json({ error: "Error deleting task" });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
