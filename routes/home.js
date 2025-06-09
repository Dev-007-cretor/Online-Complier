const express = require('express');
const router = express.Router();

router.get('/',(req,res)=>{
    res.render("home",{output:"",code:""})
})

module.exports = router;