if(process.env.NODE_ENV != 'production'){
    require('dotenv').config()
  }

const express = require('express');
const router = express.Router();
const request = require('request');
const jsSHA = require('jssha');
const uniqid = require('uniqid');
const User = require('../models/user');
const Order = require('../models/order');
const {isLoggedIn} = require('../middelware')
const { v4: uuidv4 } = require("uuid");

const checksum_lib = require('../payTM/checksum/checksum');
const config = require("../payTM/checksum/config");
const Product = require('../models/product');



// router.post('/payment_gateway/payumoney',isLoggedIn, (req, res) => {
//     req.body.txnid = uniqid.process()
//     req.body.email = req.user.email;
//     req.body.firstname = req.user.username;
//     //Here save all the details in pay object 
//     const pay = req.body;
//     const hashString = process.env.MERCHANT_KEY //store in in different file
//      + '|' + pay.txnid
//      + '|' + pay.amount 
//      + '|' + pay.productinfo 
//      + '|' + pay.firstname 
//      + '|' + pay.email 
//      + '|' + '||||||||||'
//      + process.env.MERCHANT_SALT //store in in different file
    
    
//     const sha = new jsSHA('SHA-512', "TEXT");
//     sha.update(hashString);
//     //Getting hashed value from sha module
//      const hash = sha.getHash("HEX");
     
//      //We have to additionally pass merchant key to API
    
//      pay.key = process.env.MERCHANT_KEY //store in in different file;
//      pay.surl = 'http://localhost:3000/payment/success';
//      pay.furl = 'http://localhost:3000/payment/fail';
//      pay.hash = hash;
//     //Making an HTTP/HTTPS call with request
//     request.post({
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         },
//         url: 'https://sandboxsecure.payu.in/_payment', //Testing url
//         form: pay
//      }, function (error, httpRes, body) {
//         if (error) 
//             res.send(
//                 {
//                     status: false,
//                     message:error.toString()
//             }
//      );
//      if (httpRes.statusCode === 200) {
//         res.send(body);
//      } else if (httpRes.statusCode >= 300 && 
//             httpRes.statusCode <= 400) {
//             res.redirect(httpRes.headers.location.toString());
//      }
//      })
// });
    

// router.post('/payment/success',isLoggedIn, async(req, res) => {
//     //Payumoney will send Success Transaction data to req body. 
//     //  Based on the response Implement UI as per you want
    
//     try {
//         const order= {
//             txnid: req.body.txnid,
//             amount: req.body.amount,
//             orderedProducts:req.user.cart
//         }
    
//         const placedOrder=await Order.create(order);
    
//         req.user.orders.push(placedOrder);
    
//         await req.user.save();
    
//         req.flash('success','Your Order has been Successfully Placed.Thanks for Shopping with us!')
//         res.redirect(`/user/${req.user._id}/me`);
//     }
//     catch (e) {
//         console.log(e.message);
//         req.flash('error', 'Cannot Place the Order at this moment.Please try again later!');
//         res.render('error');
//     } 
// })

// router.post('/payment/fail',isLoggedIn, (req, res) => {
//     //Payumoney will send Fail Transaction data to req body. 
//     //  Based on the response Implement UI as per you want
//     req.flash('error', `Your Payment Failed.Try again after sometime ${req.body}`);
//     res.render('error');
// })



// module.exports = router;


router.post("/pay", isLoggedIn, (req, res) => {
  // Route for making payment
  // console.log(req.user);
  var paymentDetails = {
    amount: req.body.amount,
    customerId: uuidv4(),
    customerEmail: req.body.email,
    customerPhone: req.body.phone,
  };
  if (
    !paymentDetails.amount ||
    !paymentDetails.customerId ||
    !paymentDetails.customerEmail ||
    !paymentDetails.customerPhone
  ) {
    res.status(400).send("Payment failed");
  } else {
    var params = {};
    params["MID"] = config.PaytmConfig.mid;
    params["WEBSITE"] = config.PaytmConfig.website;
    params["CHANNEL_ID"] = "WEB";
    params["INDUSTRY_TYPE_ID"] = "Retail";
    params["ORDER_ID"] = "TEST_" + new Date().getTime();
    params["CUST_ID"] = paymentDetails.customerId;
    params["TXN_AMOUNT"] = paymentDetails.amount;
    params["CALLBACK_URL"] = "http://localhost:3000/payment/success";
    params["EMAIL"] = paymentDetails.customerEmail;
    params["MOBILE_NO"] = paymentDetails.customerPhone;

    // console.log(params);
    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        var txn_url =
          "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
          form_fields +=
            "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields +=
          "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(
          '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
            txn_url +
            '" name="f1">' +
            form_fields +
            '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
        );
        console.log("redirect to callback");
        res.end();
      }
    );
  }
});

router.post("/payment/success", isLoggedIn, async (req, res) => {
  try {
    var body = req.body;

    const order = {
      txnid: req.body.TXNID,
    //   orderid: req.body.ORDERID,
      amount: req.body.TXNAMOUNT,
      orderedProducts: req.user.cart
    };

    console.log(order);
    const placedOrder=await Order.create(order);
    
    req.user.orders.push(placedOrder);

    await req.user.save();

    console.log(placedOrder);

    // req.user.orders.push(placedOrder);

    const user = req.user;
    const userid = req.user._id;
    const cartid = req.user.cart;
    console.log(cartid);

    const product = await Product.findById(order.orderedProducts);

    console.log(product);

    await User.findOneAndUpdate(
      { _id: userid },
      {
        $pullAll: { cart: cartid },
      }
    );

    await user.save();
    req.flash('success','Your Order has been Successfully Placed.Thanks for Shopping with us!')
    res.redirect(`/user/${req.user._id}/me`);

  } catch (error) {
    console.log(error);
    res.render("payment/failed", { payment: req.body });
  }
});



module.exports = router;