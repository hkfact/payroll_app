const express = require("express");
const router = express.Router();
const relation = require("../controllers/relation.controller");

router.get("/", relation.list);
router.get("/:id", relation.getById);
router.post("/", relation.create);
router.patch("/:id", relation.update);
router.delete("/:id", relation.remove);

module.exports = router;
