const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const User = require('./schemas/userSchema');

const { validateEmail } = require('./utilities/misc')

async function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        if (!validateEmail(email)) {
            return done(null, false, { msg: 'The email is not a valid email.' })
        }
        User.findOne({ email: email }).then(async user => {
            if (!user) {
                return done(null, false, { msg: 'There is no user with That email' })
            }
            done(null, user)
        })
    }

    await passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))

    await passport.serializeUser((user, done) => {
        done(null, user._id)
    })
    passport.deserializeUser(async function (id, done) {
        const user = await User.findById(id)
        done(null, user);
    });
}

module.exports = initialize