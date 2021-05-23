const express = require('express')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const path = require('path')
const app = express()
const seedDB = require('./seed')
const Product = require('./models/product')

// Session and authentication using passport
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')

//Routes
const productRoutes = require('./routes/product')
const authRoutes = require('./routes/auth')
const cartRoutes = require('./routes/cart')
const myProductRoute = require('./routes/myProduct')
const paymentRoute = require('./routes/payment')


app.set('view engine','ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))


//Connecting mongoose database
mongoose.connect('mongodb://localhost:27017/ecommerceApp',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify:false,
        useCreateIndex:true
    })
    .then(() => {
        console.log("DB Connected");
    })
    .catch(err => {
        console.log("Connection Error");
        console.log(err);
    });

// seedDB();

//Session (work in server side not client side)
const sessionConfig = {
    secret: 'weneedsomebettersecret',
    resave: false,
    saveUninitialized: true
}

app.use(session(sessionConfig));
app.use(flash());

//Iitialising passport and session for starting the user initialisation
app.use(passport.initialize())
app.use(passport.session())

//Configuring the passport for local strategy
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())



app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
})




app.get('/', (req, res) => {
    
    res.render("home");
})


app.use(productRoutes)
app.use(authRoutes)
app.use(cartRoutes)
app.use(myProductRoute)
app.use(paymentRoute)

app.listen(3000,()=>{
    console.log('server started at port 3000 successfully')
})
