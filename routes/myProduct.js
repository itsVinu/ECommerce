const express = require('express')
const { isLoggedIn } = require('../middelware')
const router = express.Router()
const Product = require('../models/product')
const User = require('../models/user')


// Getting the user product or say added by the user
router.get('/user/:userid/myproduct',isLoggedIn,async(req,res)=>{
    const user = await User.findById(req.params.userid).populate('myproduct')
    res.render('myProduct/index',{products: user.myproduct})
})

// Displaying the details of the product
router.get('/user/:userid/myproduct/:id',isLoggedIn,async(req,res)=>{
    try{
        const product = await Product.findById(req.params.id)
        res.render('myProduct/show',{product})
    }
    catch(e){
        req.flash('error','cannot show product')
        res.render('error')
    }
})

//Getting the edit form
router.get('/user/:userid/myproduct/:id/edit',isLoggedIn,async(req,res)=>{
    try{
        const product = await Product.findById(req.params.id)
        res.render('myProduct/edit',{product})
    }
    catch(e){
        req.flash('error','Cannot edit this product, Something went wrong')
        res.render('error')
    }
})

router.patch('/user/:userid/myproduct/:id',isLoggedIn,async(req,res)=>{
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body.product);
        req.flash('success', 'Updated Successfully!');
        res.redirect(`/user/${req.user._id}/myproduct/${req.params.id}`) 
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot update this Product');
        res.redirect('/error');
    }
})


// Delete a particular product from product model and user model
router.delete('/user/:userid/myproduct/:id',isLoggedIn, async (req, res) => {

    try {
        const {userid,id} = req.params
        await User.findByIdAndUpdate(userid,{$pull:{myproduct:id, cart:id}});

        await Product.findByIdAndDelete(req.params.id)
        req.flash('success', 'Deleted the product successfully');
        res.redirect(`/user/${req.user._id}/myproduct`);
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot delete this Product');
        res.redirect('/error');
    }
})


module.exports = router;