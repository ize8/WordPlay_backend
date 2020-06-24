const mongoose = require("mongoose");

let db = null;

const userSchema = new mongoose.Schema({
  email: String,
  validated: Boolean,
  validation_code: String,
  name: String,
  password: String,
  last_login: Date,
  created: Date
});

const entrySchema = new mongoose.Schema({
  simp: String,
  trad: String,
  pinyin: String,
  eng: String
});

const wordListSchema = new mongoose.Schema({
  editors: [{ type: mongoose.Schema.Types.ObjectId, ref: "userSchema" }],
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "userSchema" }],
  public: Boolean,
  label: String,
  created: Date,
  updated: Date,
  list: [entrySchema]
});

exports.WordList = mongoose.model("WordList", wordListSchema);
exports.User = mongoose.model("User", userSchema);
exports.Entry = mongoose.model("Entry", entrySchema);
exports.getMongooseConnection = () => {
  if (db == null) {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    db = mongoose.connection;
    return db;
  } else return db;
};
