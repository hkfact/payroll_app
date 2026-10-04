const express = require("express");
const router = express.Router();
const users = require("../controllers/users.controller");

router.get("/", users.list);
router.get("/:id", users.getById);
router.post("/", users.create);
router.delete("/:id", users.remove);

module.exports = router;
