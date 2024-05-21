require('dotenv').config();
const jwt=require('jsonwebtoken')
const cookieParser = require('cookie-parser');


const generateRefreshToken = require('../Controller/tokenController').generateRefreshToken;
const generateAccessToken=require('../Controller/tokenController').generateAccessToken;

const verifyAccessToken = async (req, res, next) => {
    console.log('---MiddlewareForAuth----')

    console.log('the id of the user is :',req.body.id)
    console.log('cookies : ',req.cookies['connect.sid'])
    const accessToken = req.cookies['accessToken'];
    console.log('the acces token is : --->',accessToken)
    try {
      if(accessToken){
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        console.log('the decoded token is : --->',decodedToken)
        const expirationTime = decodedToken.exp;
        const readble=new Date(expirationTime*1000)
        console.log(readble.toLocaleString())
        console.log('the expiration time is :',expirationTime/1000)
        const expirationstate=expirationTime < Date.now() / 1000
        console.log('if---> '+expirationstate)
        if(expirationstate){
          const userId =decodedToken?.userId;
          const refreshToken = await generateRefreshToken(userId);
          if (refreshToken) {
            // Generate a new access token using the refresh token
            const newAccessToken = generateAccessToken(userId)
    
            // Attach the new access token to the user's cookies
            res.cookie('accessToken', newAccessToken, { httpOnly: true });
    
            // Continue with the request using the new access token
            req.cookies.accessToken = newAccessToken;
            next();
          } else {
            // Refresh token not found or an error occurred, handle appropriately
            return res.status(401).send('Unauthorized - Refresh token not found');
          }
        }else{
          console.log('(middleware auth )->[the token is not expired] the id of the user is ' + decodedToken.userId);
          req.user = decodedToken.user; // You can attach the decoded token to the request object for further use
          next();
        }
      }else{
          // Check if the refresh token exists in the database
          const userId = req.session.passport? req.session.passport : req.body.id;
          console.log(userId,' -->is the user Id')
          const refreshToken = await generateRefreshToken(userId);
    
          if (refreshToken) {
            // Generate a new access token using the refresh token
            const newAccessToken = generateAccessToken(userId)
            console.log('the new accesToken is : ---> ',newAccessToken)
            // Attach the new access token to the user's cookies
            res.cookie('accessToken', newAccessToken, { httpOnly: true });
    
            // Continue with the request using the new access token
            req.cookies.accessToken = newAccessToken;
            next();
          } else {
            // Refresh token not found or an error occurred, handle appropriately
            return res.status(401).send('Unauthorized - Refresh token not found');
          }
      } 
    } catch (error) {
      console.error('(middleware auth )-> Error verifying token:', error);
      return res.status(403).send('Forbidden');
    }
};


module.exports = { verifyAccessToken };  