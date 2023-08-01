const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Configure multer to handle file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect('mongodb://localhost/my_form_app', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Create a schema for the form data
const formDataSchema = new mongoose.Schema({
    email: String,
    name: String,
    age: Number,
    profilePic: String,
    resume: String
});

const FormData = mongoose.model('FormData', formDataSchema);

// Parse incoming requests with JSON payloads and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use(express.static('uploads'));

// Route to display the form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to handle form submission
app.post('/submit', upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), async (req, res) => {
    const { email, name, age } = req.body;
    const profilePicPath = req.files['profilePic'][0].path;
    const resumePath = req.files['resume'][0].path;

    try {
        // Save the form data to the database
        const formData = new FormData({
            email,
            name,
            age,
            profilePic: profilePicPath,
            resume: resumePath
        });
        await formData.save();
        res.send('Form submitted successfully!');
    } catch (error) {
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
