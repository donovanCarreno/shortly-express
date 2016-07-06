var db = require('../config');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      return bcrypt.hashAsync(model.get('password'), null, null).then(function(hashedPassword) {
        model.set('password', hashedPassword);
      });
    });
  }
});

module.exports = User;
