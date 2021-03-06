var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'keyboard cat',
  resave: false, 
  saveUninitialized: false
}));
app.use(util.checkUser);
app.use(express.static(__dirname + '/public'));


app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/logout', util.requiresLogin, function(req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/', util.requiresLogin,
function(req, res) {
  console.log(req.user);
  res.render('index');
});

app.get('/create', util.requiresLogin,
function(req, res) {
  res.render('index');
});

app.get('/links', util.requiresLogin,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', util.requiresLogin,
function(req, res) {
  var uri = req.body.url;

  console.log('calling post');

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
/**
 * Create a User, with username and password if user with that username doesn't exist.
 */
app.post('/signup', function(req, res) {
  User.forge({username: req.body.username})
    .fetch()
    .then(function(user) {
      if (user) {
        res.redirect('/signup');  
      } else {       
        Users.create({
          username: req.body.username,
          password: req.body.password
        })
        .then(function(user) {
          req.session.username = user.get('username');
          res.redirect('/');
        });
      }
    })
    .catch(function(err) {
      res.status(500).send('Server Error');
    });
});

app.post('/login', function(req, res) {
  User.forge({username: req.body.username}).fetch()
    .then(function(user) {
      if (user) {
        bcrypt.compare(req.body.password, user.get('password'), function(err, correctPassword) {
          if (correctPassword) {
            // User exists, password correct
            req.session.username = user.get('username');
            res.redirect('/');
          } else {
            // User exists, password incorrect
            res.redirect('/login');
          }
        });
      } else {
        // User doesn't exist
        res.redirect('/login');
      }
    })
    .catch(function(err) {
      res.status(500).send('Server Error');
    });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
