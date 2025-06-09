const express = require('express');
const router = express.Router();

router.get('/index4',(req,res)=>{
    res.render("index4",{output:"",code:""});
})

module.exports = router;