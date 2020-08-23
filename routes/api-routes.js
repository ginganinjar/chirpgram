// Requiring our models and passport as we've configured it
const db = require("../models");
const passport = require("../config/passport");
const path = require("path");

//code for file uploads using the middleware multer
const multer = require("multer");
const user = require("../models/user");

const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./public/uploads");
  },
  filename: function(req, file, callback) {
    callback(null, "userAvatar" + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage }).single("userAvatar");

module.exports = function(app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Sending back a password, even a hashed password, isn't a good idea
    res.json({
      username: req.user.username,
      id: req.user.id
    });
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post("/api/signup", (req, res) => {
    db.User.create({
      username: req.body.username,
      password: req.body.password
    })
      .then(() => {
        res.redirect(307, "/api/login");
      })
      .catch(err => {
        res.status(401).json(err);
      });
  });

  // Route for logging user out
  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", (req, res) => {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      return res.json({});
    }
    // Otherwise send back the user's username, id and avatar
    // Sending back a password, even a hashed password, isn't a good idea

    res.json({
      username: req.user.username,
      id: req.user.id,
      avatar: req.user.avatar
    });
  });

  app.get("/api/profile", (req, res) => {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      return res.json({});
    }
    db.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(data => {
      res.json(data);
    });
  });

  app.get("/api/otheruser/:name", (req, res) => {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      return res.json({});
    }
    db.User.findOne({
      where: {
        username: req.params.name
      },

      attributes: [
        "username",
        "avatar",
        "location",
        "bio",
        "likes",
        "createdAt"
      ]
    }).then(data => {
      res.json(data);
    });
  });

  app.post("/api/avatar", (req, res) => {
    upload(req, res, err => {
      if (err) {
        return res.end("Error uploading file.");
      } else if (req.file == undefined) {
        console.log("there was an error");
      }
      db.User.update(
        {
          avatar: req.file.filename
        },
        {
          where: {
            id: req.user.id
          }
        }
      );
      res.end();
    });
  });
  app.put("/api/updateUser", (req, res) => {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      return res.json({});
    }
    db.User.update(
      {
        location: req.body.location,
        bio: req.body.bio,
        likes: req.body.likes,
        email: req.body.email,
        phone: req.body.phone
      },
      {
        where: {
          id: req.user.id
        }
      }
    );
  });
};
