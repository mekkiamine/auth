const {pool}=require('../database/DBC')
const jwt=require('jsonwebtoken')
require('dotenv').config();


//generates the access token for user authentication 
const generateAccessToken = (id) => {
    
    return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};
//checks if the users's refresh token still in the database , if not it creates a new one 
const generateRefreshToken = async (id) => {
    try {
      
        const client = await pool.connect();
        const result = await pool.query('SELECT * FROM "refreshTokens" WHERE "idUser" = $1', [id]);
        
        if (result.rows.length > 0) { // Check if rows are not empty
            const user = result.rows[0];
            return user.refreshToken;
        } else {
            const refreshToken = jwt.sign({ userId: id }, process.env.JWT_REFRESH); // Use id instead of user.id
            await pool.query('INSERT INTO "refreshTokens" ("idUser", "refreshToken") VALUES ($1, $2)', [id, refreshToken]);
            return refreshToken;
        }
    } catch (err) {
        console.log('Error in generateRefreshToken:', err);
        return null; // Handle error appropriately
    } 
};


//delete the user's refresh token from database 
const logout=(id)=>{
    try{
        pool.connect().then(
            pool.query('DELETE FROM "refreshTokens" WHERE idUser=$1',[id],(err,result)=>{
                if(err){
                    return console.log('erreur deleting the refresh token from database : ',err)
                }
                console.log('User with the id :',id,' Has been logged out Succesfully')
                return true;
            })
        )
    }catch(err){
        return console.log(err)
    }
}
//this function retrives the refresh token from database 
const getRefreshtoken = async (id) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM "refreshTokens" WHERE "idUser"=$1', [id]);

        if (result.rows.length > 0) {
            return result.rows[0].refreshToken;
        } else {
            
            return false; // Handle case where refresh token is not found
        }
    } catch (error) {
        console.error('erreur getting the refresh token from database : ', error);
        return null;
    }
};

const getRefreshtokenServer = async (req,res) => {
    console.log('user ID',req.params.id);
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM "refreshTokens" WHERE "idUser"=$1', [req.params.id]);

        if (result.rows.length > 0) {
            return res.status(200).json(result.rows[0].refreshToken);
        } else {
            return res.status(500).send('error while getting the token from the database'); // Handle case where refresh token is not found
        }
    } catch (error) {
        console.error('error getting the refresh token from database : ', error);
        return res.status(500).send('error while getting the token from the database');
    }
};

//authenticates the accessToken sent in the request 
const authenticateToken=(req,res,next)=>{

}
module.exports={generateAccessToken,generateRefreshToken,logout,getRefreshtoken,getRefreshtokenServer};
