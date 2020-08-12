var db = require("../models");

module.exports = function(app) {
  app.get("/api/", function(req, res) {
    db.TableName.findAll({}).then(function(dbTableName) {
      res.json(dbTableName);
    });
  });

  app.get("/api//:id", function(req, res) {
    db.TableName.findOne({
      where: {
        id: req.params.id
      }
    }).then(function(dbTableName) {
      res.json(dbTableName);
    });
  });

  app.post("/api/", function(req, res) {
    db.TableName.create(req.body).then(function(dbTableName) {
      res.json(dbTableName);
    });
  });

  app.delete("/api//:id", function(req, res) {
    db.TableName.destroy({
      where: {
        id: req.params.id
      }
    }).then(function(dbTableName) {
      res.json(dbTableName);
    });
  });

};
