const express = require('express');
const router = express.Router();

// Временный роут для пользователей (пока без базы данных)
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Роут пользователей будет реализован позже'
  });
});

module.exports = router;
