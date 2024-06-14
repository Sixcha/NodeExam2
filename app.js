const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();

const User = require('./model/user');

const app = express();
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true
  }));

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to the students database');
}).catch((err) => {
  console.error('Error connecting to the database', err);
});

app.get('/add-user', (req, res) => {
  res.render('addUser', { errors: [], firstName: '', lastName: '', email: '' });
});

app.post('/add-user', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    errors.push('All fields are required');
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    errors.push('Email is already in use');
  }


  if (errors.length > 0) {
    res.render('addUser', { errors, firstName, lastName, email });
  } else {
    try {
      const newUser = new User({ firstName, lastName, email, password });
      await newUser.save();
      res.redirect('/login');
    } catch (err) {
      errors.push('Error saving user: ' + err.message);
      res.render('addUser', { errors, firstName, lastName, email });
    }
  }
});

app.get('/login', (req, res) => {
    res.render('login', { errors: [] });
  });

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const errors = [];
  
    const user = await User.findOne({ email: email });
    if (!user) {
      errors.push('Invalid email or password');
    } else {
      const secret = process.env.SECRET_KEY;
      const hash = crypto.createHmac('sha256', secret)
                         .update(password)
                         .digest('hex');
      if (user.password !== hash) {
        errors.push('Invalid email or password');
      }
    }
  
    if (errors.length > 0) {
      res.render('login', { errors });
    } else {
      req.session.user = user;
      res.redirect('/dashboard');
    }
  });

  app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.render('dashboard', { user: req.session.user });
  });

  app.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      res.redirect('/login');
    });
  });

app.get('/users', async (req, res) => {
    try {
      const users = await User.find();
      res.render('listUsers', { users });
    } catch (err) {
      res.status(500).send('Error retrieving users: ' + err.message);
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});