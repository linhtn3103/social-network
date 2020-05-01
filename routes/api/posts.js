const express = require('express');
const router = express.Router();

//router get api/profile
router.get('/', (req, res) => {
  res.send('Post running');
});

module.exports = router;
