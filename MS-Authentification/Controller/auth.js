require('dotenv').config()
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')

const {pool}=require("../database/DBC.js")
const user=require("../Models/User.js")
const tokenController=require("./tokenController")


//these functions are used to verify and add new users ( students ) in the database 
const loginUser = async (req, res) => {
    console.log('---Login User function--- ');
    console.log('the request sent is : ', req.body);
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM "users" WHERE email=$1', [req.body.email]);
        client.release();

        if (result.rowCount === 0) {
            console.log('user not found');
            return res.sendStatus(404);
        }

        const pw = await bcrypt.compare(req.body.password, result.rows[0].password);
        if (pw) {
            const user = result.rows[0];
            const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
            const refreshToken = await tokenController.generateRefreshToken(user.id);
            res.cookie('accessToken', accessToken, { httpOnly: true });
            return res.status(200).json({
                message: "Login successfull",
                username: user.username,
                id:user.id,
                role:user.role
            });
        } else {
            console.log('Mot de passe incorrecte');
            return res.sendStatus(403);
        }
    } catch (error) {
        console.log('ERROR: ', error);
        return res.sendStatus(500);
    }
};

const signUpUser=async(req,res)=>{
    console.log('---SignUp Function for the user---')
    console.log(" the neww user is :--->  ",req.body)
    // const hashedPassword
    const salt =await bcrypt.genSalt()
    const hashedPassword= await bcrypt.hash(req.body.password,salt)
    pool.connect()
    pool.query('INSERT INTO "users" (username,password,email,role) VALUES ($1,$2,$3,$4) RETURNING *',[req.body.username,hashedPassword,req.body.email,req.body.role],async(err,result)=> {
        if(err){
            console.error('Error executing query', err.stack);
            return res.status(400).send(err.stack)
        }
        console.log("the result from the database is : ---> ",result.rows[0].id,'\n')
        const refreshtoken=await tokenController.generateRefreshToken(result.rows[0].id)
        const accesstoken=tokenController.generateAccessToken(result.rows[0].id)
        res.cookie('accessToken', accesstoken, { httpOnly: true });
        console.log('user Signed up successfully\n')
        return res.status(200).json({
            message:"Inscription réussie",
            idUser:result.rows[0].id
        })
    })
}

const logout=(req,res)=>{
    consolelog('---Logout Function---\n')
    req.logout(() => {
        req.session.destroy();
        console.log('loggin out now')
    });
    res.clearCookie('connect.sid')
    res.clearCookie('accessToken');
    return res.status(200).send('Logged Out Successfully');
}

module.exports={signUpUser,loginUser,logout};