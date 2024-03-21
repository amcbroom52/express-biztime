"use strict";

const express = require('express');
let db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');

const router = new express.Router();

/** Returns json of all invoices {invoices: [{id, comp_code}]} */
router.get('/', async function(req, res) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices`
  );

  const invoices = results.rows;
  return res.json({invoices});
});

/** Returns json of data for an invoice
 *
 * {invoice: {id, amt, paid, add_date, paid_date,
 *  company: {code, name, description}}}*/
router.get("/:id", async function (req, res) {
  const iResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
        FROM invoices
        WHERE id = $1`, [req.params.id]
  );

  const invoice = iResults.rows[0];

  if (!invoice) throw new NotFoundError();

  const cResults = await db.query(
    `SELECT DISTINCT code, name, description
        FROM companies
        JOIN invoices ON invoices.comp_code = companies.code
        WHERE id = $1`, [req.params.id]
  );

  const company = cResults.rows[0];
  invoice.company = company;

  return res.json({invoice});
})

/** Adds an invoice.
 *
 * Accepts json {comp_code, amt}
 * Returns json {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function(req, res) {
  if (!req.body.comp_code || !req.body.amt) {
    throw new BadRequestError("comp_code and amt data required");
  };

  const { comp_code, amt } = req.body;

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError();

  return res
    .status(201)
    .json({invoice});
});


module.exports = router;