require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const corsOptions = require('./config/corsOptions');
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors(corsOptions));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/root'));
app.use(require("./routes/media"));

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

// get driver connection
const client = new MongoClient(process.env.ATLAS_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB is connected");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
run().catch(console.dir);