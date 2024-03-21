const express = require('express');
let db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');

const router = new express.Router();

router.get('/', async function(req, res) {
  const results = await db.query(
    `SELECT code, name
    FROM companies;`
  );

  const companies = results.rows;
  return res.json({companies});
})


module.exports = router;