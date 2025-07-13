const express = require("express");
const db = require("../database");
const { log } = require("../middleware/logging");

const router = express.Router();

/**
 * @swagger
 * /trees:
 *   get:
 *     summary: Get all trees
 *     description: Retrieve all trees with their images and species information
 *     responses:
 *       200:
 *         description: List of trees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tree'
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", async (req, res) => {
  try {
    log.debug("Fetching all trees with species information");
    const query = `
SELECT
    t.id                     AS tree_id,
    i.name                   AS image_name,
    i.name_compressed        AS compressed_image_name,

    p.predicted_specie_id,
    ps.common_name ->> 'en'  AS predicted_common_name,

    p.labeled_specie_id,
    ls.common_name ->> 'en'  AS labeled_common_name

FROM trees            AS t
JOIN predictions      AS p   ON p.tree_id = t.id
JOIN trees_images     AS ti  ON ti.tree_id = t.id
JOIN images           AS i   ON i.id = ti.image_id
LEFT JOIN species     AS ps  ON ps.id = p.predicted_specie_id
LEFT JOIN species     AS ls  ON ls.id = p.labeled_specie_id;
        `;

    const result = await db.query(query);
    const trees = result.rows.map((row) => ({
      tree_id: row.tree_id,
      image_name: row.image_name,
      compressed_image_name: row.compressed_image_name,
      predicted_specie_id: row.predicted_specie_id,
      predicted_common_name: row.predicted_common_name,
      labeled_specie_id: row.labeled_specie_id,
      labeled_common_name: row.labeled_common_name,
    }));

    log.success(`Successfully fetched ${trees.length} trees`);
    res.json(trees);
  } catch (error) {
    log.error("Database error while fetching trees", error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

/**
 * @swagger
 * /trees/{tree_id}/species:
 *   put:
 *     summary: Update tree species
 *     description: Update the species identification for a specific tree
 *     parameters:
 *       - in: path
 *         name: tree_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the tree to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSpeciesRequest'
 *     responses:
 *       200:
 *         description: Tree species updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tree_id:
 *                   type: integer
 *                 prediction_id:
 *                   type: integer
 *                 message:
 *                   type: string
 *                   example: "Tree species updated successfully"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tree not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:tree_id/species", async (req, res) => {
  const { tree_id } = req.params;
  const { predicted_specie_id, labeled_specie_id, model_name, model_version } =
    req.body;

  log.info(`Updating tree ${tree_id} species`, {
    predicted_specie_id,
    labeled_specie_id,
    model_name,
    model_version,
  });

  if (
    !predicted_specie_id ||
    !labeled_specie_id ||
    !model_name ||
    !model_version
  ) {
    log.warning(`Missing required fields for tree ${tree_id} update`);
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.query("BEGIN");
    log.debug(`Started transaction for tree ${tree_id} update`);

    // Check if tree exists
    const treeCheck = await db.query("SELECT id FROM trees WHERE id = $1", [
      tree_id,
    ]);
    if (treeCheck.rows.length === 0) {
      await db.query("ROLLBACK");
      log.warning(`Tree ${tree_id} not found`);
      return res.status(404).json({ error: "Tree not found" });
    }

    // Check if prediction already exists for this tree
    const existingPrediction = await db.query(
      `
            SELECT id FROM predictions 
            WHERE tree_id = $1 AND model_name = $2 AND model_version = $3
        `,
      [tree_id, model_name, model_version]
    );

    let prediction_id;

    if (existingPrediction.rows.length > 0) {
      // Update existing prediction
      prediction_id = existingPrediction.rows[0].id;
      log.debug(
        `Updating existing prediction ${prediction_id} for tree ${tree_id}`
      );
      await db.query(
        `
                UPDATE predictions 
                SET predicted_specie_id = $1, labeled_specie_id = $2
                WHERE id = $3
            `,
        [predicted_specie_id, labeled_specie_id, prediction_id]
      );
    } else {
      // Create new prediction
      log.debug(`Creating new prediction for tree ${tree_id}`);
      const predictionResult = await db.query(
        `
                INSERT INTO predictions (tree_id, predicted_specie_id, labeled_specie_id, model_name, model_version)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `,
        [
          tree_id,
          predicted_specie_id,
          labeled_specie_id,
          model_name,
          model_version,
        ]
      );
      prediction_id = predictionResult.rows[0].id;
    }

    // Update tree with the new species
    await db.query(
      `
            UPDATE trees 
            SET recognized_specie_id = $1
            WHERE id = $2
        `,
      [labeled_specie_id, tree_id]
    );

    await db.query("COMMIT");
    log.success(`Successfully updated tree ${tree_id} species`, {
      tree_id: parseInt(tree_id),
      prediction_id,
      labeled_specie_id,
    });

    res.json({
      tree_id: parseInt(tree_id),
      prediction_id,
      message: "Tree species updated successfully",
    });
  } catch (error) {
    await db.query("ROLLBACK");
    log.error(`Database error while updating tree ${tree_id} species`, error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

module.exports = router;
