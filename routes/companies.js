const express = require('express');
let db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');

const router = new express.Router();

router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT code, name
    FROM companies;`
  );

  const companies = results.rows;
  return res.json({ companies });
});

router.get('/:code', async function (req, res) {
  const results = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`, [req.params.code]
  );

  const company = results.rows[0];
  return res.json({company});
});

router.post('/', async function(req, res) {
  const { code, name, description } = req.body;
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`, [code, name, description]
  );

  const company = results.rows[0];
  return res.json({company});
});


module.exports = router;