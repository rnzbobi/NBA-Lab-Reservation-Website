const express = require('express');
const multer = require('multer');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const moment = require('moment');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const router = express.Router();
const Stadium = require('../models/stadium');
const Reservation = require('../models/reservation');
const User = require('../models/user');

const formatDate = (date) => {
  const d = new Date(date);
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const formatTime = (date) => {
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes() === 0 ? '00' : d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

const getReservedSeatsForTimeslot = async (reservationStart, reservationEnd, stadiumId) => {
  const reservations = await Reservation.find({
    stadium: stadiumId,
    removed: false,
    $or: [
      { reservationStart: { $lt: reservationEnd, $gte: reservationStart } },
      { reservationEnd: { $lte: reservationEnd, $gt: reservationStart } },
      { reservationStart: { $lt: reservationStart }, reservationEnd: { $gt: reservationEnd } }
    ]
  });

  return reservations.reduce((acc, reservation) => acc.concat(reservation.seatNumber), []);
};

const fs = require('fs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/profilepics');  // Ensure this directory exists
    const dir = 'public/profilepics';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
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
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user || !await user.verifyPassword(password)) {
      return res.redirect('/login_page?err=true&mes=' + encodeURIComponent('Invalid email or password.'));
    }

    req.logIn(user, async function (err) {
      if (err) {
        console.log("Error occurred while logging in", err);
        return next(err);
      }

      if (rememberMe) {
        const token = crypto.randomBytes(20).toString('hex');
        const expiryDate = moment().add(3, 'weeks').toDate();
        user.rememberToken = token;
        user.rememberTokenExpiry = expiryDate;
        await user.save();
        res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 3 * 7 * 24 * 60 * 60 * 1000 }); // 3 weeks
      }

      return res.redirect('/');
    });
  } catch (err) {
    console.log("Error occurred while logging in", err);
    return next(err);
  }
};

router.post('/login', loginUser);

router.get('/modify_reservation_page', isLoggedIn, async (req, res) => {
  const reservationId = req.query.id;
  const ref = req.query.ref;
  if (reservationId) {
    try {
      const reservation = await Reservation.findById(reservationId)
        .populate('stadium')
        .populate('user')
        .exec();

      const stadium = await Stadium.findById(reservation.stadium._id);
      const reservedSeats = await getReservedSeatsForTimeslot(reservation.reservationStart, reservation.reservationEnd, stadium._id);

      // Format the current timeslot
      const currentTimeslot = `${formatTime(reservation.reservationStart)} - ${formatTime(reservation.reservationEnd)}`;

      res.render('modify_reservation_page', {
        reservation,
        timeslots: getTimeslots(),
        seatNumbers: getSeatNumbers(),
        reservedSeats,
        formatDate,
        formatTime,
        currentTimeslot, // Pass currentTimeslot to the view
        errorMessage: req.query.errorMessage,
        ref
      });
    } catch (error) {
      console.error('Error retrieving reservation data:', error);
      res.status(500).send('Error retrieving reservation data.');
    }
  } else {
    res.status(400).send('Reservation ID is required.');
  }
});

router.get('/modify_reservation_page/:id', isLoggedIn, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('stadium');
    const timeslots = getTimeslots();
    const seatNumbers = getSeatNumbers();

    const reservedTimeslots = [];
    const reservedSeats = [];

    // Fetch reservations for the same date, excluding the current reservation
    const reservations = await Reservation.find({
      stadium: reservation.stadium._id,
      reservationStart: {
        $gte: new Date(reservation.reservationStart.toDateString()),
        $lt: new Date(new Date(reservation.reservationStart.toDateString()).setDate(new Date(reservation.reservationStart.toDateString()).getDate() + 1))
      },
      _id: { $ne: req.params.id }
    });

    reservations.forEach(res => {
      reservedTimeslots.push(`${formatTime(res.reservationStart)} - ${formatTime(res.reservationEnd)}`);
      res.seatNumber.forEach(seat => reservedSeats.push(seat));
    });

    const currentTimeslot = `${formatTime(reservation.reservationStart)} - ${formatTime(reservation.reservationEnd)}`;
    res.render('modify_reservation_page', {
      title: 'Modify Reservation',
      reservation,
      timeslots,
      currentTimeslot,
      seatNumbers,
      reservedTimeslots,
      reservedSeats,
      ref: req.query.ref // Pass the ref parameter to the view
    });
  } catch (err) {
    console.error('Error fetching reservation:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/modify_reservation_page/:id', isLoggedIn, async (req, res) => {
  try {
      const { reservationDate, timeslot, seatNumbers } = req.body;
      console.log('Received reservationDate:', reservationDate);
      console.log('Received timeslot:', timeslot);
      console.log('Received seatNumbers:', seatNumbers);

      const seatNumbersArray = Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers];
      const [startTime, endTime] = timeslot ? timeslot.split(' - ') : [null, null];
      console.log('Parsed startTime:', startTime);
      console.log('Parsed endTime:', endTime);

      if (!startTime || !endTime) {
          console.error('Invalid timeslot:', timeslot);
          return res.status(400).send('Invalid timeslot');
      }

      const reservationStart = moment(`${reservationDate} ${startTime}`, 'YYYY-MM-DD hh:mm A').toDate();
      const reservationEnd = moment(`${reservationDate} ${endTime}`, 'YYYY-MM-DD hh:mm A').toDate();
      console.log('Converted reservationStart:', reservationStart);
      console.log('Converted reservationEnd:', reservationEnd);

      if (isNaN(reservationStart) || isNaN(reservationEnd)) {
          console.error('Invalid date conversion');
          return res.status(400).send('Invalid date conversion');
      }

      const reservation = await Reservation.findById(req.params.id).populate('stadium');
      if (!reservation) {
          return res.status(404).send('Reservation not found');
      }

      const ref = req.query.ref;

      const conflictingReservations = await Reservation.find({
          stadium: reservation.stadium._id,
          reservationStart: { $lt: reservationEnd },
          reservationEnd: { $gt: reservationStart },
          seatNumber: { $in: seatNumbersArray },
          _id: { $ne: req.params.id }
      });

      if (conflictingReservations.length > 0) {
          const timeslots = getTimeslots();
          const seatNumbers = getSeatNumbers();
          const reservedTimeslots = [];
          const reservedSeats = [];

          const reservations = await Reservation.find({
              stadium: reservation.stadium._id,
              reservationStart: {
                  $gte: new Date(reservation.reservationStart.toDateString()),
                  $lt: new Date(new Date(reservation.reservationStart.toDateString()).setDate(new Date(reservation.reservationStart.toDateString()).getDate() + 1))
              },
              _id: { $ne: req.params.id }
          });

          reservations.forEach(res => {
              reservedTimeslots.push(`${formatTime(res.reservationStart)} - ${formatTime(res.reservationEnd)}`);
              res.seatNumber.forEach(seat => reservedSeats.push(seat));
          });

          const currentTimeslot = `${formatTime(reservation.reservationStart)} - ${formatTime(reservation.reservationEnd)}`;

          return res.status(400).render('modify_reservation_page', {
              title: 'Modify Reservation',
              reservation,
              timeslots,
              currentTimeslot,
              seatNumbers,
              reservedTimeslots,
              reservedSeats,
              errorMessage: 'One or more selected seats are already reserved for the selected timeslot.',
              ref
          });
      }

      await Reservation.findByIdAndUpdate(req.params.id, {
          reservationStart,
          reservationEnd,
          seatNumber: seatNumbersArray
      });

      const redirectUrl = ref === 'see_reservation' ? '/see_reservation_page' : ref === 'remove_reservation' ? '/remove_reservation' : '/profile_current_reservation_page';
      res.redirect(redirectUrl);
  } catch (err) {
      console.error('Error updating reservation:', err);
      res.status(500).send('Internal Server Error');
  }
});

// Enhanced route to get reserved seats based on selected date and time with detailed logging
router.get('/reserved_seats', isLoggedIn, async (req, res) => {
  const { date, time, stadium, reservationId } = req.query;
  try {
    const [startTime, endTime] = time.split(" - ");
    const reservationStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD hh:mm A').toDate();
    const reservationEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD hh:mm A').toDate();

    console.log('Fetching reserved seats for:');
    console.log('Date:', date);
    console.log('Time:', time);
    console.log('Stadium:', stadium);
    console.log('Reservation Start:', reservationStartTime);
    console.log('Reservation End:', reservationEndTime);

    const stadiumObj = await Stadium.findOne({ name: stadium });
    if (!stadiumObj) {
      console.log('Invalid stadium:', stadium);
      return res.status(400).json({ success: false, message: 'Invalid stadium.' });
    }

    console.log('Stadium found:', stadiumObj.name);

    // Find reservations that overlap with the selected time slot and are not removed
    const reservations = await Reservation.find({
      stadium: stadiumObj._id,
      removed: false,
      _id: { $ne: reservationId }, // Exclude the current reservation
      $or: [
        { reservationStart: { $lt: reservationEndTime, $gte: reservationStartTime } },
        { reservationEnd: { $lte: reservationEndTime, $gt: reservationStartTime } },
        { reservationStart: { $lt: reservationStartTime }, reservationEnd: { $gt: reservationEndTime } }
      ]
    }).populate('user').exec();

    console.log('Reservations fetched:', reservations.length);
    reservations.forEach((reservation, index) => {
      console.log(`Reservation ${index + 1}:`, reservation);
    });

    const reservedSeats = reservations.reduce((acc, reservation) => acc.concat(reservation.seatNumber.map(seat => ({
      seatNumber: seat,
      userName: reservation.user.name,
      userId: reservation.user._id,
      anonymous: reservation.anonymous,
      isCurrentUser: req.user._id.equals(reservation.user._id),
      userProfileUrl: `/profile_page?name=${encodeURIComponent(reservation.user.name)}`
    }))), []);
    

    console.log('Reserved Seats Data:', reservedSeats); // Log the reserved seats data for debugging
    res.json({ success: true, reservedSeats });
  } catch (err) {
    console.error('Error fetching reserved seats:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Route to cancel a reservation
router.put('/cancel_reservation/:id', isLoggedIn, async (req, res) => {
  try {
      const reservation = await Reservation.findById(req.params.id);
      if (!reservation) {
          return res.status(404).json({ success: false, message: 'Reservation not found.' });
      }
      reservation.removed = true;
      await reservation.save();
      res.json({ success: true, message: 'Reservation cancelled successfully.' });
  } catch (err) {
      console.error('Error cancelling reservation:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Existing route to fetch current reservations
router.get('/profile_current_reservation_page', isLoggedIn, async (req, res) => {
  try {
      const reservations = await Reservation.find({ user: req.user._id, removed: false }) // Filter out removed reservations
          .populate('stadium')
          .exec();
      res.render('profile_current_reservation_page', { title: 'Current Reservations', user: req.user, reservations });
  } catch (err) {
      console.error('Error fetching reservations:', err);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/profile_page', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('profile_page', { 
      title: 'Profile Page',
      profilePicture: user.profilePicture,
      description: user.description,
      user: user // Pass user data
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Handle profile updates and profile deletion
router.post('/profile_page', isLoggedIn, upload.single('profilePicture'), async (req, res) => {
  try {
    const action = req.body.action;

    if (action === 'delete') {
      await User.findByIdAndDelete(req.user._id);
      req.logout((err) => {
        if (err) {
          console.error('Error logging out after account deletion:', err);
          return res.status(500).send('Internal Server Error');
        }
        res.redirect('/login_page');
      });
    } else if (action === 'update') {
      const updateData = {
        description: req.body.description,
      };

      if (req.file) {
        updateData.profilePicture = req.file.filename;
      }

      await User.findByIdAndUpdate(req.user._id, updateData);
      res.redirect('/profile_page');
    } else if (action === 'search') {
      const query = req.body.query;
      const users = await User.find({ 
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      });
      res.json({ users, currentUserEmail: req.user.email });
    } else {
      res.status(400).send('Invalid action');
    }
  } catch (err) {
    console.error('Error handling profile actions:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/register_page', (req, res) => {
  const err = req.query.err;
  res.render('register_page', { title: 'Register Page', error: err ? true : false, errorMessage: req.query.mes });
});

router.post('/register', upload.single('profilePicture'), async (req, res) => {
  const { email, password, role, name, description } = req.body;
  const profilePicture = req.file ? req.file.filename : '';

  const newUser = new User({
    email: email,
    password: password,
    role: role,
    name: name,
    description: description,
    profilePicture: profilePicture
  });

  try {
    await newUser.save();
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
  } catch (err) {
    console.log("Error occurred while registering a user", err.message);
    res.redirect('/register_page?err=true&mes=' + encodeURIComponent(err.message));
  }
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

router.get('/view_available_page', isLoggedIn, async (req, res) => {
  try {
    const reservations = await Reservation.find().populate('user');

    // Check if the user field is null and handle it
    const reservedSeats = reservations.flatMap(reservation => reservation.seatNumber.map(seat => ({
      seatNumber: seat,
      userName: reservation.user ? reservation.user.name : 'Unknown', // Handle null user
      userId: reservation.user ? reservation.user._id : null, // Handle null user
      userProfileUrl: reservation.user ? '/profile_page?name=${encodeURIComponent(reservation.user.name)}' : '#' // Properly handle null user profile URL
    })));

    res.render('view_available_page', { title: 'View Available Page', reservedSeats: JSON.stringify(reservedSeats) });
  } catch (err) {
    console.error('Error fetching reserved seats:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/logout', (req, res) => {
  if (req.user) {
    req.user.rememberToken = '';
    req.user.rememberTokenExpiry = null;
    req.user.save().then(() => {
      res.clearCookie('rememberMe');
      req.logout((err) => {
        if (err) {
          console.log("Error occurred while logging out", err);
        }
        res.clearCookie('remember_me');
        return res.redirect('/');
      });
    }).catch(err => {
      console.log("Error occurred while logging out", err);
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

router.get('/reserved_seats', isLoggedIn, async (req, res) => {
  const { date, time, stadium, reservationId } = req.query;
  try {
    const [startTime, endTime] = time.split(" - ");
    const reservationStartTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD hh:mm A').toDate();
    const reservationEndTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD hh:mm A').toDate();

    console.log('Fetching reserved seats for:');
    console.log('Date:', date);
    console.log('Time:', time);
    console.log('Stadium:', stadium);
    console.log('Reservation Start:', reservationStartTime);
    console.log('Reservation End:', reservationEndTime);

    const stadiumObj = await Stadium.findOne({ name: stadium });
    if (!stadiumObj) {
      console.log('Invalid stadium:', stadium);
      return res.status(400).json({ success: false, message: 'Invalid stadium.' });
    }

    console.log('Stadium found:', stadiumObj.name);

    // Find reservations that overlap with the selected time slot and are not removed
    const reservations = await Reservation.find({
      stadium: stadiumObj._id,
      removed: false,
      _id: { $ne: reservationId }, // Exclude the current reservation
      $or: [
        { reservationStart: { $lt: reservationEndTime, $gte: reservationStartTime } },
        { reservationEnd: { $lte: reservationEndTime, $gt: reservationStartTime } },
        { reservationStart: { $lt: reservationStartTime }, reservationEnd: { $gt: reservationEndTime } }
      ]
    }).populate('user').exec();

    console.log('Reservations fetched:', reservations.length);
    reservations.forEach((reservation, index) => {
      console.log(`Reservation ${index + 1}:`, reservation);
    });

    const reservedSeats = reservations.reduce((acc, reservation) => acc.concat(reservation.seatNumber.map(seat => ({
      seatNumber: seat,
      userName: reservation.anonymous ? 'Anonymous' : reservation.user.name,
      userId: reservation.user._id,
      anonymous: reservation.anonymous,
      isCurrentUser: req.user._id.equals(reservation.user._id),
      userProfileUrl: reservation.anonymous && !req.user._id.equals(reservation.user._id) ? null : `/profile_page?name=${encodeURIComponent(reservation.user.name)}`
    }))), []);

    console.log('Reserved Seats Data:', reservedSeats); // Log the reserved seats data for debugging
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

router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
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

function getTimeslots() {
  return [
    "9:00 AM - 9:30 AM", "9:30 AM - 10:00 AM", "10:00 AM - 10:30 AM", "10:30 AM - 11:00 AM",
    "11:00 AM - 11:30 AM", "11:30 AM - 12:00 PM", "12:00 PM - 12:30 PM", "12:30 PM - 1:00 PM",
    "1:30 PM - 2:00 PM", "2:00 PM - 2:30 PM", "2:30 PM - 3:00 PM", "3:00 PM - 3:30 PM",
    "3:30 PM - 4:00 PM", "4:00 PM - 4:30 PM", "4:30 PM - 5:00 PM", "5:00 PM - 5:30 PM"
  ];
}

function getSeatNumbers() {
  return [
    "A1", "A2", "A3", "A4", "A5", "A6",
    "B1", "B2", "B3",
    "C1", "C2", "C3", "C4", "C5", "C6",
    "D1", "D2", "D3"
  ];
}

function convertTo24Hour(time) {
  const [timePart, modifier] = time.split(' ');
  let [hours, minutes] = timePart.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM' && hours !== '12') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}`;
}

module.exports = router;