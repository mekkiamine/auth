const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const callendarController = require ('./Controller/calendarController');
const cookieParser = require('cookie-parser');

require('dotenv').config();
const corsOptions = {
  origin: 'http://localhost:4200',  
  credentials: true,
};
const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());


app.post("/events",callendarController.addEvent)
  
app.listen(process.env.PORT, () => {console.log(`Server started on port ${process.env.PORT}`)
});