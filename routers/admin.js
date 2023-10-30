const router = require('express').Router();
const answerSchema = require('../schemas/answerSchema');
const levelSchema = require('../schemas/levelSchema');
const userSchema = require('../schemas/userSchema');
const { ensureAuthenticated } = require('../utilities/authUtils');
const { checkAdmin } = require('../utilities/passportReuse');

router.post('/add', ensureAuthenticated, checkAdmin, async (req, res) => {
    const { levelNumber, maintext, authfrom, image, sourceCodeHint, answer, leveltype, authfromphoto } = req.body;
    var level = await levelSchema.findOne({ levelNumber: req.body.levelNumber });
    if (level) {
        res.send({ success: false, msg: "Level already exists." });
    } else {
        level = new levelSchema({
            levelNumber, maintext, authFrom: authfrom, image, sourceCodeHint, answer, leveltype, authfromphoto
        });
        await level.save();
        res.send({ success: true, msg: "Level added." });
    }
});

router.get('/edit', checkAdmin, async (req, res) => {
    var levels = await levelSchema.find();
    res.render('admin/edit', { user: req.user, levels: levels });
})

router.post('/edit/:id', checkAdmin, async (req, res) => {
    const { levelNumber, maintext, authfrom, image, sourceCodeHint, answer, leveltype } = req.body;
    var level = await levelSchema.findById(req.params.id);
    if (level) {
        level.levelNumber = levelNumber.toString();
        level.maintext = maintext;
        level.image = image;
        level.sourceCodeHint = sourceCodeHint;
        level.answer = answer;
        level.authFrom = authfrom;
        level.leveltype = leveltype;
        await level.save().then((level) => {
            console.log(level);
        })
        res.send({ success: true, msg: "Level edited." });
    } else {
        res.send({ success: false, msg: "Level does not exist." });
    }
});

router.get('/users', checkAdmin, async (req, res) => {
    var users = await userSchema.find();
    Promise.all(users.map(async (user) => {
        user = JSON.parse(JSON.stringify(user));
        user.answerlog = await answerSchema.find({ user: user._id });
        return user;
    })).then((users) => {
        res.send({ success: true, users })
    })
});

router.get('/banit/:id', checkAdmin, async (req, res) => {
    var user = await userSchema.findById(req.params.id);
    if (user) {
        user.plat_banned = !user.plat_banned;
        await user.save();
        res.send({ success: true, msg: "User ban updated." });
    } else {
        res.send({ success: false, msg: "User does not exist." });
    }
})

router.get('/admin/:id', checkAdmin, async (req, res) => {
    var user = await userSchema.findById(req.params.id);
    if (user) {
        user.admin = !user.admin;
        await user.save();
        res.send({ success: true, msg: "User admin updated." });
    } else {
        res.send({ success: false, msg: "User does not exist." });
    }
})

router.get('/answerlog', checkAdmin, async (req, res) => {
    var answerlog = await answerSchema.find();
    answerlog = answerlog.reverse();
    res.send({ success: true, answerlog: answerlog })
})

router.get('/leaderboard', async (req, res) => {
    var users = await userSchema.find({ "discordUser.username": { $ne: null } });
    Promise.all(users.map((user) => {
        user = JSON.parse(JSON.stringify(user));
        var newuser = {
            name: user.name,
            school: user.school,
            discord: user.discordUser.username,
            points: user.completedLevels.length * 100
        }
        return newuser;
    })).then((users) => {
        users.sort((a, b) => {
            if (a.points === b.points)
                return 0;
            return a.points > b.points ? -1 : 1;
        })
        res.send({
            success: true, users: users.slice(0, 6)
        })
    });
})

module.exports = router;