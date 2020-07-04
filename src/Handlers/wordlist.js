const models = require("../Database/Models.js");
const mw = require("../Middlewares");
var express = require("express"),
  router = express.Router();

/**
 * @swagger
 * /get-all-wordlists:
 *    post:
 *      description: returns all WordLists for the user coded in the token
 *    parameters:
 *       - name: token
 *         required: true
 *         type: string
 *         in: body
 *         description: user token
 */
router.post("/get-all-wordlists", mw.checkToken, async (req, res) => {
  const userId = req.auth.id;
  const db = models.getMongooseConnection();
  const result = await models.WordList.find({ viewers: userId }).exec();
  res.json(result);
});

/**
 * @swagger
 * /get-wordlist-by-id:
 *    post:
 *      description: returns wordlist by id
 *    parameters:
 *       - name: token
 *         required: true
 *         type: string
 *         in: body
 *         description: user token
 *       - name: id
 *         required: true
 *         type: string
 *         in: body
 *         description: id of the wordlist
 */
router.post("/get-wordlist-by-id", mw.checkToken, async (req, res) => {
  const userId = req.auth.id;
  const listId = req.body.id;
  if (!listId) {
    res.json({ error: "no wordlist id provided" });
    return;
  }
  const db = models.getMongooseConnection();
  const result = await models.WordList.findOne({ _id: listId }).exec();
  res.json(result);
});

/**
 * @swagger
 * /delete-wordlist:
 *    post:
 *      description: deletes wordlist by id
 *    parameters:
 *       - name: token
 *         required: true
 *         type: string
 *         in: body
 *         description: user token
 *       - name: id
 *         required: true
 *         type: string
 *         in: body
 *         description: id of the wordlist
 */
router.post("/delete-wordlist", mw.checkToken, async (req, res) => {
  const userId = req.auth.id;
  const listId = req.body.id;
  if (!listId) {
    res.json({ error: "no wordlist id provided" });
    return;
  }
  const db = models.getMongooseConnection();
  const result = await models.WordList.deleteOne({ _id: listId }).exec();
  res.json(result);
});

/**
 * @swagger
 * /create-wordlist:
 *    post:
 *      description: create new wordlist
 *    parameters:
 *       - name: token
 *         required: true
 *         type: string
 *         in: body
 *         description: user token
 *       - name: label
 *         required: true
 *         type: string
 *         in: body
 *         description: title of the wordlist
 *       - name: list
 *         required: true
 *         type: string
 *         in: body
 *         description: the wordlist
 */
router.post("/create-wordlist", mw.checkToken, async (req, res) => {
  const userId = req.auth.id;
  const label = req.body.label;
  const list = req.body.list;
  if (!list) {
    res.json({ error: "no wordlist provided" });
    return;
  }
  const db = models.getMongooseConnection();
  try {
    const result = await models.WordList.create({
      label: label,
      list: list,
      public: false,
      viewers: [userId],
      editors: [userId]
    });
    res.json(result);
  } catch (err) {
    console.log("ERROR:", err);
  }
});

/**
 * @swagger
 * /update-wordlist:
 *    post:
 *      description: updates wordlist by id
 *    parameters:
 *       - name: token
 *         required: true
 *         type: string
 *         in: body
 *         description: user token
 *       - name: id
 *         required: true
 *         type: string
 *         in: body
 *         description: title of the wordlist
 *       - name: list
 *         required: true
 *         type: string
 *         in: body
 *         description: the wordlist
 */
router.post("/update-wordlist", mw.checkToken, async (req, res) => {
  const userId = req.auth.id;
  const listId = req.body.id;
  const label = req.body.label;
  const list = req.body.list;
  if (!list || !listId) {
    res.json({ error: "no wordlist provided" });
    return;
  }
  const db = models.getMongooseConnection();
  try {
    const result = await models.WordList.updateOne(
      { _id: listId },
      {
        label: label,
        list: list
      }
    ).exec();
    res.json(result);
  } catch (err) {
    console.log("ERROR:", err);
  }
});

/*
missing:
*/

module.exports = router;
