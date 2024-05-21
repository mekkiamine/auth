const {pool}=require('../database/DBC')
const tokenController=require('./tokenController')
require('body-parser')
const jwt=require('jsonwebtoken')

//this function helps expose the id of the user after signing in through passportJS
const getUserId=async(req,res)=>{
    console.log('getting the user ID and informations : ')
    console.log(req.session.passport.user)
    
    res.redirect(`http://localhost:4200/redirect?id=${req.user}`);
}

const getAllTrainers=async(req,res)=>{
    try{
        await pool.connect()
        pool.query('SELECT * FROM "users" WHERE "role"=$1',['formateur'],(err,result)=>{
            if(err){
                console.log('erreur while fetching users :',err.stack)
                return res.status(500).send({err :err.stack})
            }
           
            return res.status(200).json(result.rows)
        })
    }catch(err){
        console.log('erreur fetching users :',err.stack)
        return res.status(500).send({err :err.stack})
    }
}
//this function helps retrive the user's informations and set the tokens in the browser 
const getUser=async(req,res)=>{
    try{
    pool.connect()
    console.log('this query is : --->'+req.query.id+'\n')
    pool.query('SELECT * FROM "users" where id=$1',[req.query.id],(err,result)=>{
        if(err){
            return console.log('erreur : '+err.stack+'\n')
        }
        
        //checking the result from the query
        const user=result.rows[0]
        console.log('the user is --->'+user.id+'\n')

        //generating the accessToken and setting it as a cookie
        accessToken=tokenController.generateAccessToken(user.id)       
        res.cookie('accessToken', accessToken, {
            httpOnly: true,  
            maxAge: 60000,
        });

        return res.status(200).json({user})
    })
    }catch(err){
        return console.log(err.message)
    }
}

//this function helps sets the role after Signing Up
const setRole=(req,res)=>{
    console.log('---Setting Role---')
    console.log('the role is : ',req.body.role)
    console.log('the id of the user is : ',req.body.id)
    console.log('the role is ',req.body.role,'for the user with the id ',req.body.id)
    pool.connect()
    pool.query('UPDATE "users" SET role=$1 WHERE id=$2',[req.body.role,req.body.id],(error,result)=>{
        if(error){
            return console.log(`error updating the role : `,error.message)
        }
        console.log('Role updated successfully : ')
        return res.status(200).json({message:'user updated successfully'})
    })
}

//this function inserts the first part of the submitted form of a trainer
const trainerInfos = async (req, res) => {
    console.log('---TrainerInfos---');
    console.log(`The informations received from the MS-Formateur are:\n`, req.body);
    let decodedToken=jwt.verify(req.cookies['accessToken'],process.env.JWT_SECRET) 
    try {
        
        const client = await pool.connect(); 
        try {
            console.log
            const queryText = 'UPDATE "users" SET "username"=$1, "birthdate"=$2, "phone"=$3, "address"=$4 WHERE "id"=$5';
            const params = [req.body.username, req.body. birthday, req.body.phone, req.body.address, decodedToken.userId];
            await client.query(queryText, params);
            console.log('User Informations Updated Successfully');
            res.status(200).send('User Infos Updated, Loading Step 2....');
        } catch (err) {
            console.error('Error executing update:', err.stack);
            res.status(500).send('Error inserting values in the database: ' + err.message);
        } finally {
            client.release(); // Important to release the client
        }
    } catch (err) {
        console.error('Error connecting to the database:', err.stack);
        res.status(500).send('Error connecting to the database: ' + err.message);
    }
};

const updateUser = async (req, res) => {
    console.log('----Updating user Information----');
    console.log(req.body);
    console.log(req.session.passport);

    const formData = req.body;
    let query = 'UPDATE "users" SET ';
    let queryValues = [];
    let queryIndex = 1;
    
    // Building the query string and values array
    for (const key in formData) {
        if (formData.hasOwnProperty(key)) {
            const attribute = formData[key];
            query += `"${attribute[0]}" = $${queryIndex}, `;
            queryValues.push(attribute[1]);
            queryIndex++;
        }
    }
    
    // Removing the trailing comma and space from the query string
    query = query.slice(0, -2);

    // Adding WHERE clause with the user ID
    query += ` WHERE id = $${queryIndex}`;
    queryValues.push(req.session.passport.user);

    //logging thr query
    console.log(`The query is: ${query}, and the values are \n ${queryValues}`);

    //updating the user in the database
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(query, queryValues);
            console.log('User updated successfully:', result);
            res.send('User updated successfully');
        } catch (err) {
            console.log('Error while updating user:', err.message);
            res.status(500).send('Error while updating user');
        } finally {
            client.release();
        }
    } catch (err) {
        console.log('Error while connecting to database:', err.message);
        res.status(500).send('Database connection error');
    }
};

module.exports={getUserId,getUser,setRole,trainerInfos,updateUser,getAllTrainers}