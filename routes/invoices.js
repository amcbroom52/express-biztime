"use strict";

const express = require('express');
const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');

const router = new express.Router();

/** Returns json of all invoices {invoices: [{id, comp_code}]} */
router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices
        ORDER BY id`
  );

  const invoices = results.rows;
  return res.json({ invoices });
});

//TODO: custom error messages (if desired)
/** Returns json of data for an invoice
 *
 * {invoice: {id, amt, paid, add_date, paid_date,
 *  company: {code, name, description}}}
 */
router.get("/:id", async function (req, res) {
  const results = await db.query(
    `SELECT id,
            amt,
            paid,
            add_date,
            paid_date,
            code,
            name,
            description
        FROM invoices
        JOIN companies ON companies.code = invoices.comp_code
        WHERE id = $1`, [req.params.id]
  );

  const invoiceData = results.rows[0];

  if (!invoiceData) throw new NotFoundError();

  const invoice = {
    id: invoiceData.id,
    amt: invoiceData.amt,
    paid: invoiceData.paid,
    add_date: invoiceData.add_date,
    paid_date: invoiceData.paid_date,
    company: {
      code: invoiceData.code,
      name: invoiceData.name,
      description: invoiceData.description,
    }
  };

  return res.json({ invoice });
});

/** Adds an invoice.
 *
 * Accepts json {comp_code, amt}
 * Returns json {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  if (!req.body.comp_code || !req.body.amt) {
    throw new BadRequestError("comp_code and amt data required");
  };

  const { comp_code, amt } = req.body;

  const cResults = await db.query(
    `SELECT code
        FROM companies
        WHERE code = $1`, [comp_code]
  );

  if (!cResults.rows[0]) throw new NotFoundError();

  const iResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
  );

  const invoice = iResults.rows[0];

  return res
    .status(201)
    .json({ invoice });
});

/** Updates an invoice.
 *
 * Accepts json {amt}
 * Returns json {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put('/:id', async function (req, res) {
  if (!req.body.amt) {
    throw new BadRequestError("amt data required");
  }

  const results = await db.query(
    `UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [req.body.amt, req.params.id]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError();

  return res.json({ invoice });
});

/**Deletes an invoice.
 *
 * returns json {status: "deleted"}
 */
router.delete('/:id', async function (req, res) {
  const results = await db.query(
    `DELETE FROM invoices
      WHERE id = $1
      RETURNING id`, [req.params.id]
  );

  if (!results.rows[0]) throw new NotFoundError();

  return res.json({ status: "deleted" });
});


module.exports = router;