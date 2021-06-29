require('dotenv').config()
const express = require("express");
const bodyParser = require('body-parser')
const ejs = require("ejs")
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/CryptDiary", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

const userschema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    googleId: String,
    uid: String,
    cards: [],
    accounts: [],
    addresses: [],
    notes: [],
    todo: []
});

// const card = new mongoose.Schema({
//     holder: String,

// })

userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);

const User = mongoose.model("User", userschema);
passport.use(User.createStrategy());


// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


// FacebookStrategy
passport.use(new FacebookStrategy({
        clientID: process.env.FB_APP_ID,
        clientSecret: process.env.FB_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback",
        profileFields: ["id", "displayName", "name", "gender", "picture.type(large)", "email"]
    },
    function (accessToken, refreshToken, profile, done) {
        // find the user in the database based on their Facebook id
        User.findOrCreate({
            uid: profile.id,
            name: profile.name.givenName + ' ' + profile.name.familyName,
            email: profile.emails[0].value
        }, function (err, user) {
            done(err, user);
        });

    }));

// GoogleStrategy
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/accounts",

        // This option tells the strategy to use the userinfo endpoint instead
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        // find the user in the database based on their Google id
        User.findOrCreate({
            username: profile.emails[0].value,
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }

));



app.get("/", function (req, res) {
    res.render("index")
})


app.get("/:user/:userrequest", function (req, res) {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, function (err, founduser) {
            if (err) {
                console.log(err)
            } else {
                res.render(req.params.userrequest, {
                    username: req.user.name
                })
            }
        })
    } else {
        res.redirect("/login")
    }
})

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/login")
})

app.get("/signup", function (req, res) {
    res.render("signup")
})

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', "email"]
    })
);

app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: "email"
}));

app.get('/auth/google/accounts',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // res.redirect(`/${req.user.id}/accounts`);
        res.redirect("/accounts")
    });

app.get('/auth/facebook/callback', function (req, res) {
    passport.authenticate('facebook', {
        successRedirect: `/${req.user.id}/accounts`,
        failureRedirect: '/login'
    })
});


app.post("/signup", function (req, res) {

    const user = new User({
        name: req.body.userName,
        username: req.body.username
    })

    User.register(user, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/signup");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/user/accounts");
            });
        }
    });

});

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err)
            res.redirect("/login")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect(`/${req.user.name}/accounts`)
            })
        }
    })

})

app.post("/user/submit", function (req, res) {
    request = req.body.asset;
    if (req.isAuthenticated()) {
        User.find(req.user.id, function (err, founduser) {
            if (err) {
                console(err)
            } else {
                founduser.request.push()
            }
        })
    }
})



app.listen(3000, function () {
    console.log("Servel started on port 3000");
});