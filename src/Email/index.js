const mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
  host: "api.eu.mailgun.net"
});

exports.sendVerificationEmail = user => {
  const data = {
    from: "WordPlay App <donot-reply@mg.wordplay.donotpanic.cc>",
    to: "zavori.laszlo@gmail.com",
    subject: "Verify your email!",
    // text: "Testing some Mailgun awesomness!",
    // html: "<h1>It works!</h1>"
    template: "validate-email",
    "h:X-Mailgun-Variables": JSON.stringify({
      name: user.name,
      link: `https://word-play-1.herokuapp.com/validate-email?code=${
        user.validation_code
      }`
    })
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
