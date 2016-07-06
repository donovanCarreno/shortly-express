var request = require('request');
var User = require('../app/models/user');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

// middleware
exports.checkUser = function(req, res, next) {
  if (req.session && req.session.username) {
    // Find User using req.sesssion.username 
    var user = new User({username: req.session.username});
    user.fetch().then(function(user) {
      if (user) {
        req.user = user;
      } else {
        req.session.destroy();  
      }
      next();
    })
    .catch(function(err) {
      res.status(500).send('Server Error');
    });
  } else {
    next();
  }
};

// middleware
exports.requiresLogin = function(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
};
