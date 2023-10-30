const router = require('express').Router();
const answerSchema = require('../schemas/answerSchema');
const levelSchema = require('../schemas/levelSchema');
const userSchema = require('../schemas/userSchema');
const { ensureAuthenticated, forceDeserialisation } = require('../utilities/authUtils');

router.get('/current', forceDeserialisation, ensureAuthenticated, async (req, res) => {
    var user = await userSchema.findById(req.user._id);
    if (!user.solving) {
        return res.send({ success: false, msg: "You are not solving any level." })
    }
    var level = await levelSchema.findOne({ levelNumber: user.currentLevel });
    level.answer = undefined;
    if (level) {
        res.send({ success: true, level });
    } else {
        res.send({ user, level: { maintext: "Level does not exist." } });
    }
});

router.get('/setlevel/:id',forceDeserialisation, ensureAuthenticated, async (req, res) => {
    var level;
    if (req.params.id == '11' || req.params.id == '12' || req.params.id == '14') {
        return res.send({ success: false, msg: "Manual deauth has been removed." });
    }
    try {
        level = await levelSchema.findOne({ levelNumber: req.params.id });
    } catch (err) {
        console.log(err)
    }
    if (req.user.solving) {
        return res.send({ success: false, msg: "You are already solving a level." });
    }
    if (req.user.completedLevels.includes(req.params.id)) {
        return res.send({ success: false, msg: "You have already completed this level." });
    }
    if (!req.user.availableLevels.includes(req.params.id)) {
        return res.send({ success: false, msg: "You are not allowed to solve this level." });
    }
    if (level) {
        var user = await userSchema.findById(req.user._id);
        user.currentLevel = req.params.id;
        user.solving = true;
        await user.save();
        res.send({ success: true, msg: "Level set." });
    } else {
        res.send({ success: false, msg: "Level does not exist." });
    }
})

router.post('/submit',forceDeserialisation, ensureAuthenticated, async (req, res) => {
    var user = await userSchema.findById(req.user._id);
    if (!user.solving) {
        return res.send({ success: false, msg: "You are not solving any level." })
    }
    if (user.completedLevels.includes(user.currentLevel)) {
        return res.send({ success: false, msg: "You have already completed this level." });
    }
    var level = await levelSchema.findOne({ levelNumber: user.currentLevel });
    console.log(level.answer)

    var answer = await answerSchema({
        user: req.user._id,
        levelNumber: user.currentLevel,
        try: req.body.answer,
    })
    await answer.save()

    if (level.answer.toLowerCase() == req.body.answer.toLowerCase()) {
        user.completedLevels.push(user.currentLevel);
        user.currentLevel = undefined;
        user.solving = false;
        await user.save();
        res.send({ success: true, msg:"Correct Password" });
    } else {
        res.send({ success: false, msg:"wrong Password" });
    }
})

module.exports = router;