const models = require("../Database/Models.js");
const mw = require("../Middlewares");
const nanoid = require("nanoid");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var express = require("express"),
  router = express.Router();

/**
 * @swagger
 * /login-user:
 *    post:
 *      description: logs in user and returns user data
 *    parameters:
 *       - name: email
 *         required: true
 *         type: string
 *         in: body
 *         description: email
 *       - name: password
 *         required: true
 *         type: string
 *         in: body
 *         description: password
 */
router.post("/login-user", async (req, res) => {
  const db = models.getMongooseConnection();
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;
  const hash = crypto
    .createHash("md5")
    .update(password)
    .digest("hex");
  let user = await models.User.findOne({ email: email }).exec();
  if (!user) {
    res.json({ error: "User not registered!", email: email });
    return;
  }
  if (hash !== user.password) {
    res.json({ error: "Wrong Password!", email: email });
    return;
  }
  user.last_login = new Date();
  await user.save();
  const returnUser = {
    id: user._id,
    email: user.email,
    validated: user.validated,
    name: user.name,
    lastLogin: user.last_login,
    created: user.created
  };
  const token = jwt.sign(returnUser, process.env.JWT_SECRET);
  res.json({
    user: returnUser,
    token: token
  });
});

/**
 * @swagger
 * /update-user:
 *    post:
 *      description: updates user data ***will need privilege check***
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: id
 *        description: eid of user
 *        required: true
 *        in: body
 *        type: string
 *      - name: email
 *        description: email of user
 *        required: false
 *        in: body
 *        type: string
 *      - name: name
 *        description: nickname of user
 *        required: false
 *        in: body
 *        type: string
 *      - name: password
 *        description: password of user
 *        required: false
 *        in: body
 *        type: string
 */
router.post("/update-user", mw.checkToken, async (req, res) => {
  const id = req.body.id;
  if (!id) {
    res.status(400).json({ error: "id is mandatory!" });
    return;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password
    ? crypto
        .createHash("md5")
        .update(req.body.password)
        .digest("hex")
    : null;
  const validated = req.body.validated;
  const db = models.getMongooseConnection();
  let toBeUpdated = {};
  if (email) toBeUpdated.email = email;
  if (name) toBeUpdated.name = name;
  if (password) toBeUpdated.password = password;
  if (validated) toBeUpdated.validated = validated;
  await models.User.updateOne({ _id: id }, toBeUpdated);
  res.json({ message: "User Updated! (probably...)" });
});

/**
 * @swagger
 * /delete-user:
 *    post:
 *      description: deletes a user ***will need privilege check***
 *    produces:
 *       - application/json
 *    parameters:
 *       - name: email
 *         description: email of user to be deleted
 *         required: true
 *         in: body
 *         type: string
 
 */
router.post("/delete-user", mw.checkToken, async (req, res) => {
  const email = req.body.email;
  const db = models.getMongooseConnection();
  let result = await models.User.findOne({ email: email }).exec();
  if (!result) res.status(400).json({ error: "User not found!" });
  else {
    await models.User.deleteOne({ email: email }).exec();
    res.status(200).json({ message: "User Deleted!" });
  }
});

/**
 * @swagger
 * /register-new-user:
 *    post:
 *      description: creates new user ***will need privilege check***
 *    produces:
 *       - application/json
 *    parameters:
 *       - name: name
 *         description: nickname of user
 *         required: true
 *         in: body
 *         type: string
 *       - name: email
 *         description: email of user
 *         required: true
 *         in: body
 *         type: string
 *       - name: password
 *         description: password of user
 *         required: true
 *         in: body
 *         type: string
 */
router.post("/register-new-user", async (req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  let password = req.body.password;
  const db = models.getMongooseConnection();
  let result = await models.User.findOne({ email: email }).exec();
  if (result) res.status(400).json({ error: "Email already registered!" });
  else {
    if (password)
      password = crypto
        .createHash("md5")
        .update(password)
        .digest("hex");
    let newUser = new models.User({
      email: email,
      name: name,
      password: password,
      validated: false,
      validation_code: nanoid.nanoid(25),
      last_login: new Date(),
      created: new Date()
    });
    const saved = await newUser.save();
    res.status(200).json({ id: saved._id });
  }
});

module.exports = router;
