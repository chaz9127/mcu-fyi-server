const mongoose = require('mongoose');
const uri = process.env.ATLAS_URI;
const dbName = process.env.DATABASE;

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {dbName})
  } catch(err) {
    console.log(err)
  }
}

module.exports = connectDB;