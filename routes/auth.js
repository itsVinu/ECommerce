if(process.env.NODE_ENV != 'production'){
  require('dotenv').config()
}

const express = require('express')
const router = express.Router()
const User = require('../models/user')
const passport = require('passport')
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

// Getting the form to register new user
router.get('/register',(req,res)=>{
    res.render('auth/signup')
})


// Registering new user and saving it into the database
router.post('/register',async(req,res)=>{
    try {
        const user = new User({ username: req.body.username, email: req.body.email,category:req.body.category });
        const newUser = await User.register(user, req.body.password);
        console.log(newUser)
        req.flash('success', 'Registered Successfully');
        res.redirect('/login');
    }
    catch (e) {
        req.flash('error', e.message);
        res.redirect('/register')
    }
})

//Getting the LOGIN Page
router.get('/login',(req,res)=>[
    res.render('auth/login')
])

// Logging In to the User
router.post('/login',
    passport.authenticate('local',
        {
            failureRedirect:'/login',
            failureFlash:true
        }
        ),(req,res)=>{
            try{
                req.flash('success','Welcome Back')
                console.log(req.user.category)
                res.redirect('/products')
            }
            catch(e){
                console.log(e.message)
                req.flash('error',e.message)
                res.redirect('/login')
            }
})

// Logging Out the User 
router.get('/logout',(req,res)=>{
  req.logout()
  res.redirect('/login')
})








// forgot password
router.get('/forgot', function(req, res) {
    res.render('forgot');
  });
  
  router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 600000; // 10 minute
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'aakashgpt12321@gmail.com',
            pass: `${process.env.PASSWORD}`
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'aakashgpt12321@gmail.com',
          subject: 'E-Commerce website Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });
  
  router.get('/reset/:token', (req, res)=> {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
  });
  
  router.post('/reset/:token', (req, res)=> {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'aakashgpt12321@gmail.com',
            pass: `${process.env.PASSWORD}`
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'aakashgpt12321@mail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/products');
    });
  });
  

module.exports = router;