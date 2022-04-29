const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

exports.handler = async function (event, context) {
  
  const msg = {
    to: 'gilliankok@gmail.com',
    from: 'noreply@bitcoinjungle.app',
    subject: 'New Map Item Pending Approval',
    html: 'Please visit <a href="' + process.env.URL_TO_VISIT + '">Cloud Firestore</a> to approve the new map pin submitted by a user.',
  }

  return sgMail
    .send(msg)
    .then((response) => {
      console.log(response[0].statusCode)
      console.log(response[0].headers)
    })
    .then(() => {
      return {
        statusCode: 200,
      }
    })
    .catch((error) => {
      console.error(error)
    })
}