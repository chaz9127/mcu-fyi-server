const express = require("express");
 
// mediaRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const mediaRoutes = express.Router();
const db = require("../db/conn");
 

mediaRoutes.get('/media', async (req, res) => {
  await db().then(async resp => {
    const result = await resp.collection('media').find().sort({ phase: 1, releaseDate: 1}).toArray();

    res.send(result);
  });
});

mediaRoutes.get('/media/:slug', async (req, res) => {
  const slug = encodeURI(req.params.slug);
  await db().then(async resp => {
    const result = await resp.collection('media').find({slug}).toArray();
    res.send(result);
  });
});

mediaRoutes.get('/media/related/:slug', async (req, res) => {
  const slug = req.params.slug;
  await db().then(async resp => {
    const mainTitle = await resp.collection('media').find({slug: slug}).toArray();
    let results = [];
    if (mainTitle[0]) {
      results = await resp.collection('media').find({slug: {$in: mainTitle[0].relatedMedia}}).toArray();
    }
    res.send(results);
  });
});
 
module.exports = mediaRoutes;