// Require google from googleapis package.
const { google } = require('googleapis')
// Require oAuth2 from our google instance.
const { OAuth2 } = google.auth
const axios = require ('axios');
require ('cookie-parser')
const {pool} = require ('../Database/db')


const CLIENT_ID='1052580759683-3f6obc3ho8bh9spepvn1u00t2rh4jddp.apps.googleusercontent.com';
const CLIENT_SECRET='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';
const REDIRECT_URI = 'http://localhost:3012';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Create a new instance of oAuth and set our Client ID & Client Secret.
const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate a URL for users to authorize the application
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

async function getOAuth2Client(userId,accessToken) {
    // Retrieve the user's tokens from the database
    const response =await axios.get(`http://localhost:3000/refreshToken/${userId}`) // Implement this function
    console.log(response.data);
    const tokens = {
        access_token: accessToken,
        refresh_token: response.data,
    }  
    console.log('token variables',tokens)
    const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    //oAuth2Client.setCredentials(tokens);
    oAuth2Client.credentials = tokens;
  
    return oAuth2Client;
  }
  
// Function to save event to database
async function saveEventToDatabase(event) {
  console.log(event)
  if (!event.summary || !event.start || !event.end) {
    console.error('Invalid event object');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertEventText = 'INSERT INTO "events"("summary", "location", "description", "colorid", "start_time", "end_time", "idUser") VALUES($1, $2, $3, $4, $5, $6, $7)';
    const insertEventValues = [event.summary, event.location, event.description, event.cold, new Date(event.start.dateTime).toISOString(), new Date(event.end.dateTime).toISOString(), event.idUser];
    await client.query(insertEventText, insertEventValues);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

const addEvent = async (req,res) => {
    console.log(req.body)
    console.log("message: access Token", req.cookies['accessToken'])
  // Validate request body
  if (!req.body.title ||  !req.body.start || !req.body.end) {
    return res.status(400).send('Missing required event fields.');
  }

  const { title, description, start, end, idUser } = req.body;
  console.log(idUser)

//   const oAuth2Client = await getOAuth2Client(idUser,req.cookies['accessToken']);
//   const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const event = {
    idUser: idUser,
    summary: title,
    location: 'Location details here',
    description: description,
    colorId: 1,
    start: { dateTime: new Date(start).toISOString(), timeZone: 'Africa/Tunis' },
    end: { dateTime: new Date(end).toISOString(), timeZone: 'Africa/Tunis' },
  };

  try {
    // const insertResponse = await calendar.events.insert({ calendarId: 'primary', resource: event });
    await saveEventToDatabase(event);
    res.status(200).json({ message: 'Event created and saved successfully.' });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send('Error creating event in Google Calendar.');
  }
}

module.exports = {addEvent}