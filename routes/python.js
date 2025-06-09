const express = require('express');
const router =  express.Router();

router.get('/index3',(req,res)=>{
    res.render("index3",{output:"",code:""});
})

module.exports=router;