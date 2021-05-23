const express = require('express')
const router = express.Router()
const User = require('../models/user')
const passport = require('passport')

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

module.exports = router;