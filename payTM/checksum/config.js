if(process.env.NODE_ENV != 'production'){
    require('dotenv').config()
  }
  
  var PaytmConfig = {
    mid: process.env.MERCHANT_ID,
    key: process.env.MERCHANT_KEY,
    website: process.env.WEBSITE,
  };
  
  module.exports.PaytmConfig = PaytmConfig;