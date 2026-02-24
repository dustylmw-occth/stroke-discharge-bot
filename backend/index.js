console.log('Handler starting... Loading dependencies'); // debug log, 會寫 logs

const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID || 'missing',
  process.env.CLIENT_SECRET || 'missing',
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN || 'missing'
});

const gmail = google.gmail('v1');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'default@example.com';
const DESIGNATED_TO = process.env.DESIGNATED_TO || 'test@example.com';

exports.handler = async (req, res) => {
  console.log('Received request:', req.method, req.body);

  if (req.method !== 'POST') {
    res.status(405).send('Only POST allowed');
    return;
  }

  const { summary } = req.body || {};

  if (!summary) {
    res.status(400).json({ success: false, message: 'No summary provided' });
    return;
  }

  try {
    const raw = makeBody(DESIGNATED_TO, SENDER_EMAIL, '中風出院準備檢查清單總結 - CR Stroke Discharge', summary);

    await gmail.users.messages.send({
      auth: oauth2Client,
      userId: 'me',
      requestBody: { raw }
    });

    console.log('Email sent successfully');
    res.status(200).json({ success: true, message: '總結電郵已成功發送' });
  } catch (error) {
    console.error('發送錯誤:', error.message || error);
    res.status(500).json({ success: false, error: error.message || '發送失敗' });
  }
};

function makeBody(to, from, subject, message) {
  const str = [
    'Content-Type: text/html; charset="UTF-8"\n',
    'MIME-Version: 1.0\n',
    'to: ', to, '\n',
    'from: ', from, '\n',
    'subject: ', subject, '\n\n',
    message.replace(/\n/g, '<br>')
  ].join('');

  return Buffer.from(str).toString('base64url');
}
