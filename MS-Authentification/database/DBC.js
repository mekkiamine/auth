const {Pool}=require('pg')
require('dotenv')
const pool=new Pool({
    host:process.env.HOST,
    user:process.env.USER,
    port:process.env.PORT,
    password:process.env.PASSWORD,
    database:process.env.DATABASE,
    max: 5000, // Maximum number of clients in the pool
    idleTimeoutMillis: 5000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000,
})

module.exports={pool}