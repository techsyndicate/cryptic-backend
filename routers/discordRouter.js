// Import Modules
const express = require('express'),
    discord_router = express.Router(),
    cookieParser = require("cookie-parser"),
    Axios = require('axios');

// Import Files
const userSchema = require('../schemas/userSchema'),
    { checkAuthenticated } = require('../utilities/passportReuse'),
    { getDiscordUser, refreshDiscordToken } = require('../utilities/misc'),
    { UserSerialise, ensureAuthenticated } = require('../utilities/authUtils');

// Vars
var scopes = ['identify', 'email', 'guilds'];
var prompt = 'none';

discord_router.use(cookieParser())
discord_router.get('/auth/:id', async (req, res) => {
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant
    var id = req.params.id;
    if (id == 'login') {
        return res.redirect(`https://discord.com/api/oauth2/authorize?response_type=code&client_id=${process.env.DISCORD_CLIENT_ID}&scope=${encodeURI(scopes.join(' '))}&redirect_uri=${process.env.DISCORD_REDIRECT_URI_LOGIN}&prompt=${prompt}`);
    } else if (id == 'register') {
        var user = await userSchema.findOne({ 'email': req.query.email })
        if (user) {
            return res.render('error', { error: "Email already registered!", redirect: '/discord-back/auth/login' });
        }
        else {
            var newUser = new userSchema({
                email: req.query.email,
                school: req.query.school,
                name: req.query.name,
                banned: false,
                availableLevels: ['1', '2', '3', '4', '5', '6', '7', '8'],
                admin: false
            });

            await newUser.save();
            res.redirect(`https://discord.com/api/oauth2/authorize?response_type=code&client_id=${process.env.DISCORD_CLIENT_ID}&scope=${encodeURI(scopes.join(' '))}&redirect_uri=${process.env.DISCORD_REDIRECT_URI_LOGIN}&prompt=${prompt}`);
        }
    }
});

discord_router.post('/login-callback', async (req, res, next) => {
    console.log(req.body, req.params)

    // Callback url to get the access token, refresh token to get the new access token
    // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-redirect-url-example
    await Axios({
        url: `https://discord.com/api/oauth2/token`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: `client_id=${process.env.DISCORD_CLIENT_ID}&client_secret=${process.env.DISCORD_CLIENT_SECRET}&grant_type=authorization_code&code=${req.body.code}&redirect_uri=${process.env.DISCORD_REDIRECT_URI_LOGIN}`
    }).then(async (res_dis) => {
        var discordUser = await getDiscordUser(res_dis.data.access_token)
        var user_dis = await userSchema.findOne({ 'email': discordUser.email })
        user_dis.discord = res_dis.data;
        user_dis.discordUser = discordUser;
        user_dis.save();
        console.log(discordUser, user_dis)
        if (!user_dis) {
            return res.render('error', { error: "Please create an account and link your discord before trying to login!", redirect: '/register' });
        }
        try {
            user_dis = JSON.parse(JSON.stringify(user_dis));
            user_dis.password = "abcd";
            const token = UserSerialise(user_dis);
            res.status(200).cookie("VeinAuth", token, {
                maxAge: 1000 * 60 * 60 * 24 * 7
            }).json({
                success: true,
                msg: "User logged in",
                data: {
                    token: token
                }
            });
        } catch (err) {
            console.log(err)
            res.send({ msg: "Failed to Authenticate", success: false });
        }

    }).catch(err => {
        console.log(JSON.parse(JSON.stringify(err)));
        res.send({ success: false, error: err })
    })
});

// update current user's discord data
discord_router.get('/current-user', ensureAuthenticated, async (req, res, next) => {
    // get current user from discord, header(Authorization = Bearer <token>)
    // https://discord.com/api/users/@me
    // https://discord.com/developers/docs/game-sdk/users#getcurrentuser

    if (req.user.discord.access_token) {
        var data = await getDiscordUser(req.user.discord.access_token);
        if (data.toJSON) {
            data = JSON.parse(JSON.stringify(data.toJSON()))
        }
        if (data.status && data.status == 401) {
            // refresh token
            var refresh_token = req.user.discord.refresh_token;
            var refresh_data = await refreshDiscordToken(refresh_token);
            userSchema.findById(req.user.id).then(async (user) => {
                refresh_data.ISSUED_AT = new Date().toString();
                user.discord = refresh_data;
                user.discordUser = await getDiscordUser(refresh_data.access_token)
                user.discordUser.ISSUED_AT = new Date().toString();
                user.save().then(() => {
                    res.send(user.discordUser);
                });
            });
        }
        else {
            userSchema.findById(req.user.id).then(async (user) => {
                user.discordUser = data;
                user.discordUser.ISSUED_AT = new Date().toString();
                user.save().then(() => {
                    res.send(data);
                });
            });
        }
    } else {
        res.send({ success: false });
    }
})

module.exports = discord_router;