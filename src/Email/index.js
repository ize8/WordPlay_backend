const mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: "mg.wordplay.donotpanic.cc"
});

exports.sendTestEmail = () => {
  const data = {
    from: "Excited User <me@mg.wordplay.donotpanic.cc>",
    to: "zavori.laszlo@gmail.com",
    subject: "It's working",
    text: "Testing some Mailgun awesomness!"
  };
  return new Promise((resolve, reject) => {
    mailgun.messages().send(data, function(error, body) {
      console.log("error:", error);
      console.log("body:", body);
      if (error) reject(error);
      else resolve(body);
    });
  });
};
