const express = require("express");
const router = express.Router();
const salaries = require("../controllers/salaries.controller");

// Defined before "/:id" — different path shape (two segments vs one) so
// there's no actual routing collision, but keeping the more specific route
// first for readability.
router.get("/:id", salaries.getById);
router.get("/", salaries.list);
router.get("/breakdown/:salaryId", salaries.getBreakdown);
router.post("/", salaries.create);
router.patch("/:id", salaries.update);
router.delete("/:id", salaries.remove);

module.exports = router;
