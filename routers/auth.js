// Import Modules
const express = require('express'),
    auth_router = express.Router(),
    bcrypt = require('bcrypt'),
    passport = require('passport');
const { checkAuthenticated } = require('../utilities/passportReuse');

// Import Files
const User = require('../schemas/userSchema'),
    { validateEmail } = require('../utilities/misc');
const { ensureAuthenticated, forceDeserialisation } = require('../utilities/authUtils');
const userSchema = require('../schemas/userSchema');

// Send User Data
auth_router.get("/user", forceDeserialisation, ensureAuthenticated,async (req, res) => {
    if (req.user) {
        var user = JSON.parse(JSON.stringify(req.user));
        delete user.password;
        user.success = true;
        res.send(user);
    }
    else {
        res.send({ success: false, msg: "User not found" });
    } 
    
    if (req.user.availableLevels.includes('11') || req.user.availableLevels.includes('12') || req.user.availableLevels.includes('14')) {
        var user = await userSchema.findById(req.user._id);
        user.availableLevels = user.availableLevels.filter((level) => {
            return level != '11' && level != '12' && level != '14';
        });
        console.log(user)
        user.save();
    }

    if (req.user.completedLevels.includes('1') && req.user.completedLevels.includes('2') && !req.user.availableLevels.includes('9')) {
        var user = await userSchema.findById(req.user._id);
        console.log(user)
        user.availableLevels = [...user.availableLevels, '9'];
        user.save();
    }

    if ((req.user.completedLevels.includes('3') || req.user.completedLevels.includes('4')) && !req.user.availableLevels.includes('10')) {
        var user = await userSchema.findById(req.user._id);
        console.log(user)
        user.availableLevels = [...user.availableLevels, '10'];
        user.save();
    }
    
    if ((req.user.completedLevels.includes('9') || req.user.completedLevels.includes('10')) && !req.user.availableLevels.includes('13')) {
        var user = await userSchema.findById(req.user._id);
        console.log(user)
        user.availableLevels = [...user.availableLevels, '13'];
        user.save();
    }

    if ((req.user.completedLevels.includes('13')) && !req.user.availableLevels.includes('15')) {
        var user = await userSchema.findById(req.user._id);
        console.log(user)
        user.availableLevels = [...user.availableLevels, '15'];
        user.save();
    }

});

// Logout User
auth_router.get('/logout', (req, res) => {
    req.logout();
    res.send({ success: true });
})


module.exports = auth_router;