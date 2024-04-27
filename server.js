require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const connectDB = require('./db/conn');
const mongoose = require('mongoose');
const corsOptions = require('./config/corsOptions');
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors(corsOptions));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/root'));
app.use('/users', require('./routes/userRoutes'));
app.use('/media', require('./routes/mediaRoutes'));
app.use('/auth', require('./routes/authRoutes'));

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', 'NotFound404.html'))
  } else if (req.accepts('json')) {
    res.json({ message: '404 Not Found'});
  } else {
    res.type('txt').send('404 Not Found');
  }
});

connectDB();

mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
