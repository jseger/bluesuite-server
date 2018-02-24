const mail = require('@sendgrid/mail')

exports.send_welcome_mail = () => {
  mail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: 'jesse.seger@gmail.com',
    from: 'test@example.com',
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  mail.send(msg);
};