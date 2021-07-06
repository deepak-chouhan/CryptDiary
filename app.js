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
const {
    request
} = require('express');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
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

const accountSchema = new mongoose.Schema({
    website: String,
    email: String,
    password: String
})
const Account = mongoose.model("Account", accountSchema)

const cardSchema = new mongoose.Schema({
    bankname: String,
    cardHolder: String,
    cardNumber: String,
    expiry: String,
    pin: String,
    cvv: String
})
const Card = mongoose.model("Card", cardSchema)

const addressSchema = new mongoose.Schema({
    addressName: String,
    flat: String,
    area: String
})
const Address = mongoose.model("Address", addressSchema)

const noteSchema = new mongoose.Schema({
    heading: String,
    note: String
})
const Note = mongoose.model("Note", noteSchema)

const todoSchema = new mongoose.Schema({
    todo: String
})
const Todo = mongoose.model("Todo", todoSchema)


const userschema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    googleId: String,
    uid: String,
    cards: [cardSchema],
    accounts: [accountSchema],
    addresses: [addressSchema],
    notes: [noteSchema],
    todo: [todoSchema]
});


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
            googleId: profile.id,
            name: profile.name.givenName + " " + profile.name.familyName
        }, function (err, user) {
            return cb(err, user);
        });
    }

));



app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("index", {
            logged: true,
            username: req.user.name
        })
    } else {
        res.render("index", {
            logged: false
        })
    }
})


app.get("/user/:name/:userrequest", function (req, res) {

    if (req.isAuthenticated()) {
        User.findById(req.user.id, function (err, founduser) {
            if (err) {
                console.log(err)
            } else {

                switch (req.params.userrequest) {
                    case "accounts":
                        res.render(req.params.userrequest, {
                            username: req.user.name,
                            assets: founduser.accounts
                        })
                        break
                    case "cards":
                        res.render(req.params.userrequest, {
                            username: req.user.name,
                            assets: founduser.cards
                        })
                        break
                    case "addresses":
                        res.render(req.params.userrequest, {
                            username: req.user.name,
                            assets: founduser.addresses
                        })
                        break
                    case "notes":
                        res.render(req.params.userrequest, {
                            username: req.user.name,
                            assets: founduser.notes
                        })
                        break
                    case "todo":
                        res.render(req.params.userrequest, {
                            username: req.user.name,
                            assets: founduser.todo
                        })
                        break

                }
            }
        })
    } else {
        console.log("not auth")
        res.redirect("/")
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
        res.redirect(`/user/${req.user.name}/accounts`);
    });

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect(`/user/${req.user.name}/accounts`);
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
                res.redirect(`/user/${req.user.name}/accounts`);
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
                res.redirect(`/user/${req.user.name}/accounts`)
            })
        }
    })

})

app.post("/user/:user/submit", function (req, res) {

    if (req.isAuthenticated()) {

        User.findById(req.user.id, function (err, founduser) {
            if (err) {
                console.log(err)
            } else {

                var request = req.body.asset;

                switch (request) {
                    case "accounts":

                        const account = new Account({
                            website: req.body.website,
                            email: req.body.email,
                            password: req.body.password
                        })

                        founduser.accounts.push(account);
                        founduser.save();
                        res.redirect(`/user/${req.user.name}/${request}`);
                        break;

                    case "cards":

                        const card = new Card({
                            bankname: req.body.bankname,
                            cardHolder: req.body.holdername,
                            cardNumber: req.body.cardnumber,
                            expiry: req.body.expiry,
                            pin: req.body.pin,
                            cvv: req.body.cvv
                        })

                        console.log(card)

                        founduser.cards.push(card);
                        founduser.save();
                        res.redirect(`/user/${req.user.name}/${request}`);
                        break;

                    case "addresses":

                        const address = new Address({
                            addressName: req.body.addressname,
                            flat: req.body.flat,
                            area: req.body.area
                        })

                        founduser.addresses.push(address);
                        founduser.save();
                        res.redirect(`/user/${req.user.name}/${request}`);
                        break;

                    case "notes":

                        const note = new Note({
                            heading: req.body.heading,
                            note: req.body.note
                        })

                        founduser.notes.push(note);
                        founduser.save();
                        res.redirect(`/user/${req.user.name}/${request}`);
                        break;

                    case "todo":

                        const todo = new Todo({
                            todo: req.body.todo
                        })

                        founduser.todo.push(todo);
                        founduser.save();
                        res.redirect(`/user/${req.user.name}/${request}`);

                }

            }
        })

    }
})

app.post("/user/:user/:request/remove", function (req, res) {

    if (req.isAuthenticated()) {

        var assetId = req.body.remove;
        var request = req.params.request;

        User.findById(req.user.id, function (err, founduser) {
            if (err) {
                console.log(err)
                res.redirect("/")
            } else {
                switch (request) {
                    case "accounts":
                        founduser.accounts.remove({
                            _id: assetId
                        });
                        break;

                    case "cards":
                        founduser.cards.remove({
                            _id: assetId
                        });
                        break;

                    case "addresses":
                        founduser.addresses.remove({
                            _id: assetId
                        });
                        break;

                    case "notes":
                        founduser.notes.remove({
                            _id: assetId
                        });
                        break;

                    case "todo":
                        founduser.todo.remove({
                            _id: assetId
                        });
                        break
                }
                founduser.save();
                res.redirect(`/user/${req.user.name}/${request}`);
            }
        })

    } else {
        res.redirect("/login")
    }

})



app.listen(3000, function () {
    console.log("Servel started on port 3000");
});