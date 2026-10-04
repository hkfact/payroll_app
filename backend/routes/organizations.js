const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const organizations = require("../controllers/organizations.controller");

router.get("/", requireRole("super_admin"), organizations.list);
router.get("/:id", requireRole("super_admin"), organizations.getById);
router.post("/", requireRole("super_admin"), organizations.create);

module.exports = router;
