const userSchema = require("../schemas/userSchema");
const jwt = require("jsonwebtoken");

async function tryDeserialisation(req, res, next) {
    let token;
    if (req?.headers?.authorization?.split(" ")[0] === "Bearer") {
        token = req?.headers?.authorization?.split(" ")[1];
    } else if (req?.cookies?.['VeinAuth']) {
        token = req?.cookies?.['VeinAuth'];
    } else {
        return next();
    }
    if (token.at(-1) == ',') {
        token = token.slice(0, -1);
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET);
    } catch (err) {
        console.log(err);
        return next();
    }
    if (!decodedToken) {
        return next();
    }

    userSchema.findById(decodedToken.userId).then(user => {
        req.user = user;
        return next();
    }).catch(err => {
        console.log(err);
        return next();
    });
}

function forceDeserialisation(req, res, next) {
    let token;
    if (req?.headers?.authorization?.split(" ")[0] === "Bearer") {
        token = req?.headers?.authorization?.split(" ")[1];
    } else if (req?.cookies?.['VeinAuth']) {
        token = req?.cookies?.['VeinAuth'];
    } else {
        return res.send({ success: false, msg: "User not authenticated" });
    }
    if (token.at(-1) == ',') {
        token = token.slice(0, -1);
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET);
    } catch (err) {
        console.log(err);
        return res.send({ success: false, msg: "User not authenticated" });
    }
    if (!decodedToken) {
        return res.send({ success: false, msg: "User not authenticated" });
    }
    console.log(decodedToken)

    userSchema.findById(decodedToken.userId).then(user => {
        req.user = user;
        console.log(user);
        return next();
    }).catch(err => {
        console.log(err);
        return res.send({ success: false, msg: "User not authenticated" });
    });
}


function UserSerialise(user) {
    //Creating jwt token
    return token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.SECRET,
        { expiresIn: "10h" }
    );
}

function ensureAuthenticated(req, res, next) {
    console.log(req.user)
    if (req.hasOwnProperty("user") && JSON.parse(JSON.stringify(req.user)).hasOwnProperty("_id")) {
        console.log("Authenticated");
        return next();
    } else {
        res.send({ success: false, msg: "User != authenticated" });
    }
}

module.exports = {
    tryDeserialisation,
    UserSerialise,
    ensureAuthenticated,
    forceDeserialisation
}