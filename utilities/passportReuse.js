function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.send({success: false, msg: "User not authenticated"});
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect(`/profile`);
    }
    next();
}

function checkAdmin(req, res, next) {
    if (req.hasOwnProperty("user") && JSON.parse(JSON.stringify(req.user)).hasOwnProperty("_id") && req.user.admin === true) {
        console.log("Authenticated");
        return next();
    } else {
        res.send({ success: false, msg: "User not authenticated" });
    }

}

module.exports = { checkAdmin, checkAuthenticated, checkNotAuthenticated }