const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query("SELECT id, name FROM industries");
    return res.json({ industries: result.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      "SELECT id, name FROM industries WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find invoice ${result.id}`, 404);
    }
    return res.json({ industry: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { name } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO industries (name) VALUES ($1) RETURNING id, name",
      [name]
    );
    return res.status(201).json({ industry: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const id = req.params.id;
  const { name } = req.body;
  try {
    const result = await db.query(
      "Update industries SET name = $1 WHERE id = $2 RETURNING id, name",
      [name, id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${company}`, 404);
    }
    return res.json({ industry: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM industries WHERE id = $1", [id]);
    return res.json({ msg: `Deleted industry with id: ${id}!` });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;