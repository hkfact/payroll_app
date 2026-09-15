const express = require("express");
const router = express.Router();
const criteria = require("../controllers/criteria.controller");

router.get("/", criteria.list);
router.get("/:id", criteria.getById);

module.exports = router;
