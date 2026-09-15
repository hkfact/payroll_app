const express = require("express");
const router = express.Router();
const history = require("../controllers/history.controller");

router.get("/", history.list);
router.get("/:id", history.getById);

module.exports = router;
