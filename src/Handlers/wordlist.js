const models = require("../Database/Models.js");
const mw = require("../Middlewares");
var express = require("express"),
  router = express.Router();

/**
 * @swagger
 * /get-all-wordlist:
 *    post:
 *      description: returns all WordLists for the user coded in the token
 *    parameters:
 *       - name: token
 *         required: true
 *         type: string
 *         in: body
 *         description: user token
 */
router.post("/get-all-wordlist", mw.checkToken, async (req, res) => {
  const userId = req.auth.id;
  const db = models.getMongooseConnection();
  const result = await models.WordList.find({ viewers: userId }).exec();
  res.json(result);
});

module.exports = router;
