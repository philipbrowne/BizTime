// Routes for Biztime Companies

const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT code, name, description FROM companies`
    );
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      `SELECT code, name, description FROM companies WHERE code=$1`,
      [code]
    );
    const res2 = await db.query(
      'SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1',
      [code]
    );

    if (!results.rows[0]) {
      throw new ExpressError(`Cannot find company under code of ${code}`, 404);
    }
    const { name, description } = results.rows[0];
    return res.json({
      company: { code, name, description, invoices: res2.rows },
    });
  } catch (e) {
    return next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name || !description)
      throw new ExpressError(
        'Request must have Code, Name, and Description',
        422
      );
    const results = await db.query(
      'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description',
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    if (!name || !description)
      throw new ExpressError('Request must have Name and Description', 422);
    const results = await db.query(
      'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description',
      [name, description, code]
    );
    if (!results.rows[0]) {
      throw new ExpressError(`Cannot find company under code of ${code}`, 404);
    }
    return res.send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) {
      throw new ExpressError('Invalid Request', 422);
    }
    const results = await db.query('DELETE FROM companies WHERE code=$1', [
      code,
    ]);
    if (results.rowCount === 0)
      throw new ExpressError('Invalid Company Code', 404);
    return res.send({ status: 'deleted' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
