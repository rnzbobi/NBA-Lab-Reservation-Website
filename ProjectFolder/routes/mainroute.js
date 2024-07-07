const express = require('express');
const router = express.Router();
const Stadium = require('../models/stadium');

// Route to serve the home.hbs file with stadium data
router.get('/', async (req, res) => {
  try {
    const stadiums = await Stadium.find();
    res.render('home', { title: 'Main Page', stadiums });
  } catch (err) {
    console.error('Error fetching stadiums:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Routes for other HTML files
router.get('/login_page', (req, res) => {
  res.render('login_page', { title: 'Login Page' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log("User: ", username + " logged in successfully!");
  res.redirect('/');
});

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
  res.render('register_page', { title: 'Register Page' });
});

router.post('/register', (req, res) => {
  const { firstname, lastname, username, password, description } = req.body;
  var name = firstname + ' ' + lastname;
  console.log("Registering user: ", username);
  console.log("Name: ", name);
  console.log("Description: ", description);
  res.redirect('/login_page');
});

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
