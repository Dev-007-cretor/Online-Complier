const express= require('express');
const router = express.Router();

router.get("/index", (req, res) => {
  res.render("index", { output: "", code: "" });
});

module.exports = router;