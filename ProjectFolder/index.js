require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require("body-parser");
const passport = require('passport');
const path = require('path');
const exphbs = require('express-handlebars');
const mainroute = require('./routes/mainroute'); 
const moment = require('moment');
const cookieParser = require('cookie-parser');
const User = require('./models/user');

const app = express();
const port = 3000;

const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    },
    formatDate: function (date) {
      const d = new Date(date);
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      const year = d.getFullYear();
      return `${year}-${month}-${day}`;
    },
    formatTime: function (date) {
      const d = new Date(date);
      const hours = ('0' + d.getHours()).slice(-2);
      const minutes = ('0' + d.getMinutes()).slice(-2);
      return `${hours}:${minutes}`;
    },
    or: function (a, b) {
      return a || b;
    },
    eq: function (a, b) {
      return a === b;
    },
    includes: function (array, value) {
      return array && array.includes(value);
    },
    addTime: function (date, unit, amount) {
      return moment(date).add(amount, unit).toDate();
    },
    currentDate: function () {
      return new Date();
    }
  }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static('uploads'));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: process.env.NODE_ENV === 'production' // Ensures the cookie is only sent over HTTPS in production
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const checkRememberMe = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  const rememberToken = req.cookies.rememberMe;
  if (!rememberToken) {
    return next();
  }

  try {
    const user = await User.findOne({ rememberToken, rememberTokenExpiry: { $gte: new Date() } });

    if (user) {
      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }

        // Extend remember token expiry
        user.rememberTokenExpiry = moment().add(3, 'weeks').toDate();
        await user.save();

        // Extend session cookie expiry
        req.session.cookie.maxAge = 3 * 7 * 24 * 60 * 60 * 1000; // 3 weeks

        return next();
      });
    } else {
      next();
    }
  } catch (err) {
    console.log("Error occurred while checking remember me token", err);
    next();
  }
};

app.use(checkRememberMe);

mongoose.connect('mongodb://localhost:27017/lab_reservation').then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Connection error', err);
});

app.use('/', mainroute);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});