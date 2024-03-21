"use strict";

const express = require('express');
let db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');

const router = new express.Router();

/** Returns Json of all companies: {companies: [{code, name}]} */
router.get('/', async function (req, res) {
  const results = await db.query(
    `SELECT code, name
    FROM companies;`
  );

  const companies = results.rows;
  return res.json({ companies });
});

/** Returns Json of a single company:
 *
 * {company: {code, name, description, invoices: [id,...]}}
 */
router.get('/:code', async function (req, res) {
  const cResults = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`, [req.params.code]
  );

  const company = cResults.rows[0];

  if (!company) throw new NotFoundError();

  const iResults = await db.query(
    `SELECT id
    FROM invoices
    WHERE comp_code = $1
    ORDER BY id`, [req.params.code]
  );

  company.invoices = iResults.rows.map(i => i.id);

  return res.json({ company });
});

/** Takes Json of data {code, name, description} and creates new company
 *
 * Returns Json: {company: {code, name, description}}
*/
router.post('/', async function (req, res) {
  if (!req.body.name || !req.body.description || !req.body.code) {
    throw new BadRequestError("Code, Name, and Description data required.");
  }
  const { code, name, description } = req.body;
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`, [code, name, description]
  );

  const company = results.rows[0];
  return res
    .status(201)
    .json({ company });
});

/**Takes Json of data {name, description} and updates a single company
 *
 * Returns Json: {company: {code, name, description}}
 */
router.put('/:code', async function (req, res) {
  if (!req.body.name || !req.body.description) {
    throw new BadRequestError("Name and Description data required.");
  }
  const { name, description } = req.body;
  const results = await db.query(
    `UPDATE companies
        SET name = $1,
        description = $2
      WHERE code = $3
      RETURNING code, name, description`, [name, description, req.params.code]
  );

  company = results.rows[0];

  if (!company) throw new NotFoundError();

  return res.json({ company });
});


/** Deletes a single company
 *
 *  Returns Json: {message: "Deleted"} if successful
 */
router.delete('/:code', async function (req, res) {
  const results = await db.query(
    `DELETE FROM companies
      WHERE code = $1
      RETURNING code`, [req.params.code]
  );

  if (!results.rows[0]) throw new NotFoundError();

  return res.json({ status: "Deleted" });
});




module.exports = router;