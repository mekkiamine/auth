const express=require('express')
const passport = require('passport')
const session=require('express-session')
require('./Controller/authGoogle')
const cors=require('cors')
const cookieParser = require('cookie-parser');
require('dotenv').config()
const authentication=require('./Controller/auth')
const userController=require('./Controller/userController');
const tokenController=require('./Controller/tokenController');
const { pool } = require('./database/DBC');
const middleware=require('./middlewares/auth').verifyAccessToken
const crypto = require('crypto');
const corsOptions = {
  origin: 'http://localhost:4200',  
  credentials: true,
};

const app=express();
app.use(cors(corsOptions));
app.use(
    session({
      secret: process.env.JWT_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new (require('connect-pg-simple')(session))({
        pool: pool,
        tableName: 'sessions',
      }),
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days; adjust as needed
      }
    })
);
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())
app.use(cookieParser());

app.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))
app.get('/google/redirect', passport.authenticate('google', {
    successRedirect: 'http://localhost:3000/userId',
    failureRedirect: '/'
}));
app.get('/userId',userController.getUserId);
app.get('/user',userController.getUser);
app.get('/trainers',userController.getAllTrainers)
app.get('/refreshToken/:id',tokenController.getRefreshtokenServer)

app.patch('/role',middleware,userController.setRole)
app.patch('/formateur',middleware,userController.trainerInfos);

app.post('/login',authentication.loginUser);
app.post('/signup',authentication.signUpUser);
app.delete('/logout', middleware, authentication.logout);


//test endpoints
app.get('/test',middleware,(req,res)=>{
  res.send('Bonjournoooo')
})

app.patch('/user',userController.updateUser)


app.listen(3000,()=>{
    console.log('app up and running on port 3000')
}) 


////Lazzzmeni naamel el scenario if a user exists w howa aamel signup yetaada ll main page toul 
//mehc yemchi ll form sign up 