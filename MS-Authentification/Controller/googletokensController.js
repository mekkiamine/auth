const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const { pool } = require('../database/DBC');

const oauth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Generates access and refresh tokens using OAuth2Client
const generateTokens = async (code) => {
    try {
        console.log('Attempting to generate tokens with code:', code);
        const { tokens } = await oauth2Client.getToken({ code });
        oauth2Client.setCredentials(tokens);
        console.log('Generated tokens:', tokens);

        const accessToken = tokens.access_token;
        const refreshToken = tokens.refresh_token;

        if (!accessToken || !refreshToken) {
            console.error('Access or refresh token is missing:', tokens);
            return null;
        }

        return { accessToken, refreshToken };
    } catch (err) {
        console.error('Error generating tokens:', err.response ? err.response.data : err);
        return null;
    }
};

// Stores the refresh token in the database
const storeRefreshToken = async (userId, refreshToken) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM "refreshTokens" WHERE "idUser" = $1', [userId]);

        if (result.rows.length > 0) {
            await client.query('UPDATE "refreshTokens" SET "refreshToken" = $1 WHERE "idUser" = $2', [refreshToken, userId]);
        } else {
            await client.query('INSERT INTO "refreshTokens" ("idUser", "refreshToken") VALUES ($1, $2)', [userId, refreshToken]);
        }
        console.log('Stored refresh token for user:', userId);
    } catch (err) {
        console.error('Error storing refresh token:', err);
    }
};

// Retrieves the refresh token from the database
const getRefreshToken = async (userId) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM "refreshTokens" WHERE "idUser" = $1', [userId]);

        if (result.rows.length > 0) {
            return result.rows[0].refreshToken;
        } else {
            return null;
        }
    } catch (err) {
        console.error('Error getting refresh token from database:', err);
        return null;
    }
};

// Refreshes the access token using the refresh token
const refreshAccessToken = async (userId) => {
    try {
        const refreshToken = await getRefreshToken(userId);

        if (!refreshToken) {
            throw new Error('No refresh token found');
        }

        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        const accessToken = credentials.access_token;

        return accessToken;
    } catch (err) {
        console.error('Error refreshing access token:', err);
        return null;
    }
};

// Middleware to authenticate the access token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.sendStatus(401);

    oauth2Client.verifyIdToken({ idToken: token, audience: process.env.CLIENT_ID })
        .then(ticket => {
            const payload = ticket.getPayload();
            req.user = payload;
            next();
        })
        .catch(err => {
            console.error('Error authenticating token:', err);
            res.sendStatus(403);
        });
};

module.exports = {
    generateTokens,
    storeRefreshToken,
    getRefreshToken,
    refreshAccessToken,
    authenticateToken
};
