const path = require("path");

// Routes
module.exports = function(app) {

  // index route loads view.html
  app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/blog.html"));
  });

  // cms route loads .html
  app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/.html"));
  });

  // blog route loads .html
  app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/.html"));
  });

  // authors route loads .html
  app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/.html"));
  });

};
