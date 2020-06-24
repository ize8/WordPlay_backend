const mailgun = require("mailgun-js");

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

exports.sendTestEmail = () => {
  const data = {
    from: "Excited User <me@mg.wordplay.donotpanic.cc>",
    to: "zavori.laszlo@gmail.com",
    subject: "It's working!",
    text: "Testing some Mailgun awesomness!"
  };
  return new Promise((resolve, reject) => {
    mg.messages().send(data, function(error, body) {
      console.log("error:", error);
      console.log("body:", body);
      if (error) reject(error);
      else resolve(body);
    });
  });
};
