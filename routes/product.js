const express = require('express');
const router = express.Router();

const Product = require('../models/product')
const User = require('../models/user')
const Review = require('../models/review')
const {isLoggedIn} = require('../middelware')

//Getting all products
router.get('/products',async(req,res)=>{
    try{
        const products = await Product.find({})
        res.render('products/index',{products})
    }
    catch(e){
        console.log(e.message)
        req.flash('error','Cannot Find Products!')
        res.render('/error')
    }
    
})

//Getting template for adding new product
router.get('/products/new',(req,res)=>{
    res.render('products/new');
})

// Displaying all products
router.post('/products',isLoggedIn,async(req,res)=>{
    try{
        const product = await Product.create(req.body.product)

        const user = req.user
        user.myproduct.push(product)

        await user.save()

        req.flash('success','Product Created Successfully')
        res.redirect('/products')
    }
    catch(e){
        console.log(e.message)
        req.flash('error','Cannot Add Product, Something went Wrong')
        res.render('error')
    }
    
})

// Show particular product
router.get('/products/:id', async(req, res) => {
    try {
        const product=await Product.findById(req.params.id).populate('reviews');
        res.render('products/show', { product});
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot find this Product');
        res.redirect('/error');
    }
})

// Get the edit form
router.get('/products/:id/edit', async(req, res) => {

    try {
        const product=await Product.findById(req.params.id);
        res.render('products/edit',{product});
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot Edit this Product');
        res.redirect('/error');
    }
})

// Upadate the particular product
router.patch('/products/:id',isLoggedIn, async(req, res) => {
    
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body.product);
        req.flash('success', 'Updated Successfully!');
        res.redirect(`/products/${req.params.id}`) 
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot update this Product');
        res.redirect('/error');
    }
})


// Delete a particular product
// router.delete('/products/:id',isLoggedIn, async (req, res) => {

//     try {
//         const {id} = req.params.id
//         await User.findByIdAndUpdate(id,{$pull:{myproduct:id}});

//         await Product.findByIdAndDelete(req.params.id)
//         req.flash('success', 'Deleted the product successfully');
//         res.redirect('/products');
//     }
//     catch (e) {
//         console.log(e.message);
//         req.flash('error', 'Cannot delete this Product');
//         res.redirect('/error');
//     }
// })



//adding and displaying comment
router.post('/products/:id/review',isLoggedIn, async (req, res) => {
    
    try {
        const product = await Product.findById(req.params.id);
        const review = new Review(req.body);

        product.reviews.push(review);

        await review.save();
        await product.save();

        req.flash('success','Successfully added your review!')
        res.redirect(`/products/${req.params.id}`);
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot add review to this Product');
        res.redirect('/error');
    }
    
})



router.get('/error',(req,res)=>{
    res.status(404).render('error');
})

module.exports = router;

