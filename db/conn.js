const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.ATLAS_URI;

// get driver connection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = async () => {
  let conn;
  try {
    conn = await client.connect();
  } catch(e) {
    console.error(e);
  }
  return await conn.db(process.env.DATABASE);
}


module.exports = db;