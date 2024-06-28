const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;

// Set up Handlebars
app.engine('hbs', exphbs.engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.hbs file
app.get('/', (req, res) => {
  res.render('index', { title: 'Main Page' });
});

// Routes for other HTML files
app.get('/login_page', (req, res) => {
  res.render('login_page', { title: 'Login Page' });
});

app.get('/modify_reservation_page', (req, res) => {
  res.render('modify_reservation_page', { title: 'Modify Reservation Page' });
});

app.get('/profile_current_reservation_page', (req, res) => {
  res.render('profile_current_reservation_page', { title: 'Profile Current Reservation Page' });
});

app.get('/profile_page', (req, res) => {
  res.render('profile_page', { title: 'Profile Page' });
});

app.get('/register_page', (req, res) => {
  res.render('register_page', { title: 'Register Page' });
});

app.get('/remove_reservation', (req, res) => {
  res.render('remove_reservation', { title: 'Remove Reservation' });
});

app.get('/reserve_seat_page', (req, res) => {
  res.render('reserve_seat_page', { title: 'Reserve Seat Page' });
});

app.get('/see_reservation_page', (req, res) => {
  res.render('see_reservation_page', { title: 'See Reservation Page' });
});

app.get('/view_available_page', (req, res) => {
  res.render('view_available_page', { title: 'View Available Page' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
