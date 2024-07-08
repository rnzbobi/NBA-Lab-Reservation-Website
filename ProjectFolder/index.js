require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require("body-parser");
const passport = require('passport');
const path = require('path');
const exphbs = require('express-handlebars');
const mainroute = require('./routes/mainroute'); 

const app = express();
const port = 3000;

app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended: false}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static('uploads'));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/lab_reservation').then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Connection error', err);
});

// Use the mainroute for routing
app.use('/', mainroute);

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
