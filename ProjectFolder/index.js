const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;

app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.hbs file
app.get('/', (req, res) => {
  res.render('home', { title: 'Main Page' });
});

// Routes for other HTML files
app.get('/login_page', (req, res) => {
  res.render('login_page', { title: 'Login Page' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log("User: ", username + " logged in successfully!");

  res.redirect('/');
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

app.post('/register', (req, res) => {
  const { firstname, lastname, username, password, description } = req.body;

  var name = firstname + ' ' + lastname;
  console.log("Registering user: ", username);
  console.log("Name: ", name);
  console.log("Description: ", description);

  res.redirect('/login_page');
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
