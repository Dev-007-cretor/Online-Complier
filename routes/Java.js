const express=require('express');
const router = express.Router();

router.get("/index2",(req,res)=>{
   res.render("index2",{output:"",code:""})
})
module.exports = router