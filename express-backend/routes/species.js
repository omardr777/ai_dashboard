const express = require("express");
const db = require("../database");
const { log } = require("../middleware/logging");

const router = express.Router();

/**
 * @swagger
 * /species:
 *   get:
 *     summary: Get all species
 *     description: Retrieve all available species with their common names
 *     responses:
 *       200:
 *         description: List of species
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Species'
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", async (req, res) => {
  try {
    log.debug("Fetching all species");
    const query = "SELECT id, common_name ->> 'en' as common_name FROM species";
    const result = await db.query(query);

    const species = result.rows.map((row) => ({
      id: row.id,
      common_name: row.common_name,
    }));

    log.success(`Successfully fetched ${species.length} species`);
    res.json(species);
  } catch (error) {
    log.error("Database error while fetching species", error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

module.exports = router;
