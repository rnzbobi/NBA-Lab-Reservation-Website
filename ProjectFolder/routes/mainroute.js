const express = require('express');

const multer = require('multer');
const path = require('path');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const router = express.Router();

const Stadium = require('../models/stadium');
const User = require('../models/user');

// Setup multer for file handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/images');  // Ensure this directory exists
  },
  filename: function (req, file, cb) {
      // Generating a unique filename to avoid overwriting existing files
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Configure Passport to use LocalStrategy with custom fields
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, User.createStrategy()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

// Additional routes setup
router.get('/login_page', (req, res) => {
    const err = req.query.err;
    res.render('login_page', { title: 'Login Page', error: err ? true : false });
});

loginUser = async (req, res)=>{
  let { email, password } = req.body;
  const user = new User({
    email,
    password
  });
  req.login(user, function(err) {
    if(err){
      console.log("Error occurred while logging in", 
      err);
    }else{
      passport.authenticate('local')(req,res,async ()=>{
        const userdetails = await User.findOne
        ({email})
        console.log("The user", userdetails)
        res.send(userdetails)
      })
    }
  });
}

router.post('/login', loginUser);

router.get('/modify_reservation_page', (req, res) => {
    res.render('modify_reservation_page', { title: 'Modify Reservation Page' });
});

router.get('/profile_current_reservation_page', (req, res) => {
    res.render('profile_current_reservation_page', { title: 'Profile Current Reservation Page' });
});

router.get('/profile_page', (req, res) => {
    res.render('profile_page', { title: 'Profile Page' });
});

router.get('/register_page', (req, res) => {
    const err = req.query.err;
    const mes = req.query.mes;
    res.render('register_page', { title: 'Register Page', err: err ? true : false, errmessage: mes });
});

registerUser = async (req, res) => {
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
                      // Use an alert to notify the user.
                      alert('Registration successful! You will be redirected to the login page.');
    
                      // Redirect immediately after they click 'OK' on the alert dialog.
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
};

router.post('/register', upload.single('profilePicture'), registerUser);

router.get('/remove_reservation', (req, res) => {
    res.render('remove_reservation', { title: 'Remove Reservation' });
});

router.get('/reserve_seat_page', (req, res) => {
    res.render('reserve_seat_page', { title: 'Reserve Seat Page' });
});

router.get('/see_reservation_page', (req, res) => {
    res.render('see_reservation_page', { title: 'See Reservation Page' });
});

router.get('/view_available_page', (req, res) => {
    res.render('view_available_page', { title: 'View Available Page' });
});

module.exports = router;
