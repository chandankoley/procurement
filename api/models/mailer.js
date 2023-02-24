var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ID,
    pass: process.env.GMAIL_TOKEN
  }
});

var sendMail = function(options) {
    var mailOptions = {
        from: process.env.GMAIL_ID,
        to: options.to,
        subject: options.subject,
        html: options.body
    };
      
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = {
    sendMail: sendMail
};