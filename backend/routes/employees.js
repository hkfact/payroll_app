const express = require("express");
const router = express.Router();
const users = require("../controllers/users.controller");

router.get("/", users.listEmployees);
router.get("/:id", users.getEmployeeById);

module.exports = router;
