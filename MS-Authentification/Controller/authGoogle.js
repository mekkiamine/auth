const passport=require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const {pool}=require('../database/DBC')
const User=require('../Models/User')
const jwt=require('jsonwebtoken')
const tokenController=require("./tokenController")

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/redirect"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
        // Check if the user already exists based on googleId
        const existingUserQuery = {
          text: 'SELECT * FROM users WHERE googleId = $1',
          values: [profile.id],
        };
        
        const existingUserResult = await pool.query(existingUserQuery);
    
        if (existingUserResult.rows.length > 0) {
          const user = existingUserResult.rows[0];
          const access_Token = tokenController.generateAccessToken(user.id); 
          const refreshToken = await tokenController.generateRefreshToken(user.id);
          user.accessToken = access_Token;
          user.refreshToken = refreshToken;
          user.exists=true
          console.log(user)
          return cb(null, {user: user});
        } else {
         
          const newUserQuery = {
            text: 'INSERT INTO users (googleId, username, thumbnail,email) VALUES ($1, $2, $3,$4) RETURNING *',
            values: [profile.id, profile.displayName, profile.photos[0].value,profile.emails[0].value],
          };
          const newUserResult = await pool.query(newUserQuery);
          const newUser = newUserResult.rows[0];
          const accessToken =tokenController.generateAccessToken(newUser.id) 
          const refreshToken = tokenController.generateRefreshToken(newUser.id)
          newUser.accessToken = accessToken; 
          newUser.refreshToken = refreshToken;
          newUser.exists=false;
          return cb(null, { user: newUser });
        }
      } catch (error) {
        // Handle errors
        console.error('Error in Google OAuth2 strategy:', error);
        return cb(error, null);
    }
}));

passport.serializeUser(function(user, done){
  done(null,user.user.id)
});

passport.deserializeUser(function(id,done){

  done(null,id)
})