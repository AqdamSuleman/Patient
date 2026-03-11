// index.js

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hospital Patient API is running");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    })
.then(() => console.log("MongoDB connected"))
.catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
});

// Employee Schema
const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNumber: { type: String, required: true },
    department: { type: String, enum: ["HR", "IT", "Finance", "Marketing"], required: true },
    designation: { type: String, required: true },
    salary: { type: Number, required: true, min: 0 },
    dateOfJoining: { type: Date, required: true },
    employmentType: { type: String, enum: ["Full-time", "Part-time", "Contract"], required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

const Employee = mongoose.model("Employee", employeeSchema);

// Utility: generate unique employee ID
const generateEmployeeId = () => "EMP" + Date.now();

// Routes

// Create Employee
app.post("/employees", async (req, res, next) => {
    try {
        const data = req.body;
        data.employeeId = generateEmployeeId();
        const employee = new Employee(data);
        await employee.save();
        res.status(201).json(employee);
    } catch (err) {
        next(err);
    }
});

// Get All Employees
app.get("/employees", async (req, res, next) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (err) {
        next(err);
    }
});

// Get Employee by ID
app.get("/employees/:id", async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: "Employee not found" });
        res.status(200).json(employee);
    } catch (err) {
        next(err);
    }
});

// Update Employee
app.put("/employees/:id", async (req, res, next) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedEmployee) return res.status(404).json({ message: "Employee not found" });
        res.status(200).json(updatedEmployee);
    } catch (err) {
        next(err);
    }
});

// Delete Employee
app.delete("/employees/:id", async (req, res, next) => {
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        if (!deletedEmployee) return res.status(404).json({ message: "Employee not found" });
        res.status(200).json({ message: "Employee deleted successfully" });
    } catch (err) {
        next(err);
    }
});

// Search Employees by Name or Department
app.get("/employees/search", async (req, res, next) => {
    try {
        const { name, department } = req.query;
        const query = {};
        if (name) query.fullName = { $regex: name, $options: "i" };
        if (department) query.department = department;
        const employees = await Employee.find(query);
        res.status(200).json(employees);
    } catch (err) {
        next(err);
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err);
    if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: "Duplicate value error", fields: err.keyValue });
    }
    res.status(500).json({ message: "Server Error" });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
