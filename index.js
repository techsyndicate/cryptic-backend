const { tryDeserialisation } = require('./utilities/authUtils');

require('dotenv').config()

const express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    session = require("cookie-session"),
    path = require('path'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    url = require('url');

const port = process.env.PORT || 4000,
    admminRouter = require('./routers/admin'),
    levelRouter = require('./routers/levelRouter'),
    discord_router = require('./routers/discordRouter'),
    authRouter = require("./routers/auth");

corsOptions = {
    origin: true,
    credentials: true
}

app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');

    app.use(session({
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: true,
        sameSite: 'none',
        overwrite: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }));
} else {
    app.use(session({
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: true,
    }));
    app.disable('trust proxy');
}

app.use((req, res, next) => {
    if (req.headers.hasOwnProperty('x-forwarded-proto') && req.headers['x-forwarded-proto'].toString() !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect('https://' + req.headers.host + req.url);
    }
    else {
        next();
    }
})

app.set('view engine', 'ejs');

app.use(bodyParser.json({
    parameterLimit: 100000,
    limit: '50mb'
}));

app.use(bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: '50mb',
    extended: true
}));

app.use(express.static(path.join(__dirname, 'public')));

const db = process.env.MONGO_URL

app.use(tryDeserialisation)
app.use("/auth", authRouter)
app.use('/discord-back', discord_router)
app.use('/admin', admminRouter)
app.use('/level', levelRouter)

app.use((err, req, res, next) => {
    next(err)
})

mongoose.set("strictQuery", false)

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to Mongo DB")
})
app.listen(port, () => {
    console.log(`TS Encryptid listening at http://localhost:${port}`)
})