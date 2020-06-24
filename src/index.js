const nanoid = require("nanoid");

const express = require("express");
const bodyParser = require("body-parser");
var morgan = require("morgan");

const mw = require("./Middlewares");
const models = require("./Database/Models.js");
const mail = require("./Email");
const userHandlers = require("./Handlers/user.js");
const wordListHandlers = require("./Handlers/wordlist.js");

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
  apis: ["./src/index.js", "./src/Handlers/*.js"]
};

const specs = swaggerJsdoc(options);

const app = express();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(bodyParser.json());
app.use(morgan("short"));
app.use(mw.CORS);

app.use("/", userHandlers);
app.use("/", wordListHandlers);

app.get("/send-test-email", async (req, res) => {
  try {
    await mail.sendTestEmail();
    console.log("Email sent!");
    res.json("Email sent!!");
  } catch (err) {
    console.log("ERROR:", err);
    res.json("Sorry, some fuckup happened :(");
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
  res.json({
    user: req.auth
  });
});

app.get("/", (req, res) => {
  res.send(`An alligator approaches!`);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Gator app listening on port 3000!")
);
