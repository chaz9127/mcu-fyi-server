const mongoose = require('mongoose');
const uri = process.env.ATLAS_URI;
const dbName = process.env.DATABASE;

// get driver connection
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// const db = async () => {
//   let conn;
//   try {
//     conn = await client.connect();
//   } catch(e) {
//     console.error(e);
//   }
//   return await conn.db(process.env.DATABASE);
// }

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {dbName})
  } catch(err) {
    console.log(err)
  }
}

module.exports = connectDB;