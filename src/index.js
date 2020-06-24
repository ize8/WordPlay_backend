const nanoid = require("nanoid");

const express = require("express");
const bodyParser = require("body-parser");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var morgan = require("morgan");

const mw = require("./Middlewares");
const models = require("./Database/Models.js");
const mail = require("./Email");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    // Like the one described here: https://swagger.io/specification/#infoObject
    info: {
      title: "WordPlay API",
      version: "1.0.0",
      description: "WordPlay API summary"
    }
  },
  // List of files to be processes. You can also set globs './routes/*.js'
  apis: ["./src/index.js"]
};

const specs = swaggerJsdoc(options);

const app = express();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(bodyParser.json());
app.use(morgan("short"));
app.use(mw.CORS);

app.get("/send-test-email", async (req, res) => {
  try {
    await mail.sendTestEmail();
    console.log("Email sent");
    res.json("Email sent!!");
  } catch (err) {
    console.log("ERROR:", err);
    res.json("Some fuckup happened :(");
  }
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
app.post("/update-user", mw.checkToken, async (req, res) => {
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
app.post("/delete-user", mw.checkToken, async (req, res) => {
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
app.post("/register-new-user", mw.checkToken, async (req, res) => {
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

/*
.../validate-email?code=1234567890
*/
/**
 * @swagger
 * /validate-email:
 *    get:
 *      description: validates user email
 *    produces:
 *       - application/json
 *    parameters:
 *       - name: code
 *         description: validation code for user
 *         required: true
 *         in: query
 *         type: string
 */
app.get("/validate-email", async (req, res) => {
  const code = req.query.code;
  console.log("<< Validating Email >>", code);
  const db = models.getMongooseConnection();
  const result = await models.User.findOne({ validation_code: code }).exec();
  if (!result) res.status(400).json({ error: "Code not found!" });
  else {
    await models.User.updateOne(
      { _id: result._id },
      { validated: true, validation_code: null }
    ).exec();
    res.status(200).json({ message: "Email validated!" });
  }
});

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
app.post("/get-all-wordlist", mw.checkToken, async (req, res) => {
  const userId = req.auth.id;
  const db = models.getMongooseConnection();
  const result = await models.WordList.find({ viewers: userId }).exec();
  res.json(result);
});

/**
 * @swagger
 * /validate-token:
 *    post:
 *      description: validates token and returns user data
 *    parameters:
 *       - name: token
 *         required: true
 *         type: string
 *         in: body
 *         description: user token
 */
app.post("/validate-token", mw.checkToken, async (req, res) => {
  console.log("<< Validate Token >>");
  res.json({
    user: req.auth
  });
});

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
app.post("/login-user", async (req, res) => {
  const db = models.getMongooseConnection();
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;
  const hash = crypto
    .createHash("md5")
    .update(password)
    .digest("hex");
  const user = await models.User.findOne({ email: email }).exec();
  if (!user) {
    res.json({ error: "User not registered!", email: email });
    return;
  }
  if (hash !== user.password) {
    res.json({ error: "Wrong Password!", email: email });
    return;
  }
  const returnUser = {
    id: user._id,
    email: user.email,
    validated: user.validated,
    name: user.name,
    lastLogin: user.last_login
  };
  const token = jwt.sign(returnUser, process.env.JWT_SECRET);
  res.json({
    user: returnUser,
    token: token
  });
});

app.get("/", (req, res) => {
  res.send(`An alligator approaches!`);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Gator app listening on port 3000!")
);
