// Requiring our custom middleware for checking if a user is logged in
const isAuthenticated = require("../config/middleware/isAuthenticated");

module.exports = function(app) {
  app.get("/", (req, res) => {
    // If the user already has an account send them to the members page
  
    if (!req) {
      return res.status(401).json({
        status: 'error',
        error: 'req body cannot be empty',
      });
    }
  
    if (req.user) {
      return res.render("chat");
    }
    
    res.render("login");


  });

  app.get("/signup", (req, res) => {
    // If the user already has an account send them to the members page
    if (req.user) {
      return res.render("chat");
    }
    res.render("signup");
  });


  app.get("/login", (req, res) => {
    // If the user already has an account send them to the members page
    if (req.user) {
      return res.render("chat");
    }
    res.render("login");
  });

  // Here we've add our isAuthenticated middleware to this route.
  // If a user who is not logged in tries to access this route they will be redirected to the signup page
  app.get("/members", isAuthenticated, (req, res) => {
    return res.render("chat");
  });

  app.get("/profile", isAuthenticated, (req, res) => {
    return res.render("profile");
  });
};
