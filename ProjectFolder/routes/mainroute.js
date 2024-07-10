const express = require('express');
const multer = require('multer');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const moment = require('moment');
const router = express.Router();
const Stadium = require('../models/stadium');
const Reservation = require('../models/reservation');
const User = require('../models/user');

// Setup multer for file handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/profilepics');  // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Configure Passport to use LocalStrategy with custom fields
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

router.use(setAuthStatus);

// Define routes
router.get('/', async (req, res) => {
  try {
    const stadiums = await Stadium.find();
    res.render('home', { title: 'Main Page', stadiums });
  } catch (err) {
    console.error('Error fetching stadiums:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/login_page', (req, res) => {
  const err = req.query.err;
  res.render('login_page', { title: 'Login Page', error: err ? true : false, errorMessage: req.query.mes });
});

const loginUser = async (req, res, next) => {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      console.log("Error occurred while logging in", err);
      return next(err);
    }
    if (!user) {
      return res.redirect('/login_page?err=true&mes=' + encodeURIComponent('Invalid email or password.'));
    }
    req.logIn(user, function (err) {
      if (err) {
        console.log("Error occurred while logging in", err);
        return next(err);
      }
      return res.redirect('/');
    });
  })(req, res, next);
};

router.post('/login', loginUser);

router.get('/modify_reservation_page', isLoggedIn, (req, res) => {
  res.render('modify_reservation_page', { title: 'Modify Reservation Page' });
});

router.get('/profile_current_reservation_page', isLoggedIn, (req, res) => {
  res.render('profile_current_reservation_page', { title: 'Profile Current Reservation Page' });
});

router.get('/profile_page', isLoggedIn, (req, res) => {
  res.render('profile_page', { title: 'Profile Page' });
});

router.get('/register_page', (req, res) => {
  const err = req.query.err;
  res.render('register_page', { title: 'Register Page', error: err ? true : false, errorMessage: req.query.mes });
});

router.post('/register', upload.single('profilePicture'), async (req, res) => {
  let { email, password, role, name, description } = req.body;
  let profilePicture = req.file ? req.file.filename : '';

  let newUser = new User({
    email: email,
    password: password,
    role: role,
    name: name,
    description: description,
    profilePicture: profilePicture
  });

  User.register(newUser, password, (err, user) => {
    if (err) {
      console.log("Error occurred while registering a user", err.message);
      return res.redirect('/register_page?err=true&mes=' + encodeURIComponent(err.message));
    }

    passport.authenticate("local")(req, res, () => {
      res.send(`
        <html>
            <head>
                <title>Registration Complete</title>
                <script>
                    alert('Registration successful! You will be redirected to the login page.');
                    window.location.href = '/login_page';
                </script>
            </head>
            <body>
                <p>If you are not redirected, <a href="/login_page">click here</a>.</p>
            </body>
        </html>
      `);
    });
  });
});

router.get('/remove_reservation', isLoggedIn, async (req, res) => {
  try {
    const reservations = await Reservation.find({ removed: false }).populate('stadium user').exec();
    const formattedReservations = reservations.map(reservation => {
      const now = new Date();
      const isExpired = reservation.reservationEnd < now;
      const isActive = reservation.reservationStart <= now && now <= reservation.reservationEnd;
      let status = 'Pending';
      if (isExpired) {
        status = 'Expired';
      } else if (isActive) {
        status = 'Active';
      }
      return { ...reservation.toObject(), status };
    });
    res.render('remove_reservation', { title: 'Remove Reservation', reservations: formattedReservations });
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/see_reservation_page', isLoggedIn, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).populate('stadium').exec();
    res.render('see_reservation_page', { title: 'Your Reservations', reservations });
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).send('Internal Server Error');
  }
});


router.put('/remove_reservation/:id', isLoggedIn, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }
    reservation.removed = true;
    await reservation.save();
    res.json({ success: true, message: 'Reservation removed successfully.' });
  } catch (err) {
    console.error('Error removing reservation:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


router.put('/update_reservation_status/:id', isLoggedIn, async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }
    reservation.status = status;
    await reservation.save();
    res.json({ success: true, message: 'Reservation status updated successfully.' });
  } catch (err) {
    console.error('Error updating reservation status:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/reserve_seat_page', isLoggedIn, async (req, res) => {
  try {
    const reservations = await Reservation.find();
    const reservedSeats = reservations.reduce((acc, reservation) => acc.concat(reservation.seatNumber), []);
    res.render('reserve_seat_page', { title: 'Reserve Seat Page', reservedSeats: JSON.stringify(reservedSeats) });
  } catch (err) {
    console.error('Error fetching reserved seats:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/see_reservation_page', isLoggedIn, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).populate('stadium').exec();
    res.render('see_reservation_page', { title: 'Your Reservations', reservations });
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/view_available_page', isLoggedIn, (req, res) => {
  res.render('view_available_page', { title: 'View Available Page' });
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log("Error occurred while logging out", err);
      return res.redirect('/');
    }
    res.redirect('/');
  });
});

router.get('/reserved_seats', isLoggedIn, async (req, res) => {
  const { date, time, stadium } = req.query;

  try {
    const [startTime, endTime] = time.split(" - ");
    const reservationStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD hh:mm A').toDate();
    const reservationEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD hh:mm A').toDate();

    const stadiumObj = await Stadium.findOne({ name: stadium });
    if (!stadiumObj) {
      return res.status(400).json({ success: false, message: 'Invalid stadium.' });
    }

    // Find reservations that overlap with the selected time slot and are not removed
    const reservations = await Reservation.find({
      stadium: stadiumObj._id,
      removed: false,
      $or: [
        { reservationStart: { $lt: reservationEndTime, $gte: reservationStartTime } },
        { reservationEnd: { $lte: reservationEndTime, $gt: reservationStartTime } },
        { reservationStart: { $lt: reservationStartTime }, reservationEnd: { $gt: reservationEndTime } }
      ]
    });

    const reservedSeats = reservations.reduce((acc, reservation) => acc.concat(reservation.seatNumber), []);
    res.json({ success: true, reservedSeats });
  } catch (err) {
    console.error('Error fetching reserved seats:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


router.post('/reserve', isLoggedIn, async (req, res) => {
  const { seats, date, time, anonymous, stadium } = req.body;
  const user = req.user;

  try {
    const stadiumObj = await Stadium.findOne({ name: stadium });
    if (!stadiumObj) {
      return res.status(400).json({ success: false, message: 'Invalid stadium.' });
    }

    const [startTime, endTime] = time.split(" - ");
    const reservationStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD hh:mm A').toDate();
    const reservationEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD hh:mm A').toDate();

    console.log(`Parsed Start Time: ${reservationStartTime}, Parsed End Time: ${reservationEndTime}`);

    const reservation = new Reservation({
      stadium: stadiumObj._id,
      user: user._id,
      seatNumber: seats,
      reservedAt: new Date(),
      reservationStart: reservationStartTime,
      reservationEnd: reservationEndTime,
      anonymous
    });

    await reservation.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login_page');
}

function setAuthStatus(req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user;
  res.locals.isLabTech = req.isAuthenticated() && req.user.role === 'lab_technician';
  next();
}

module.exports = router;
