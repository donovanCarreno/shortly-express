var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',

  /**
   * 1. check if user with name exists
   */
  createUser: function(name, pwd) {
    return User.forge({username: name, password: pwd}).fetch().then(function(results) {
      console.log(results);
      return results;
    });
  }

});

module.exports = User;