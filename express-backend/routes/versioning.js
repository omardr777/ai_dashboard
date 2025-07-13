const express = require("express");
const db = require("../database");
const { log } = require("../middleware/logging");
const { s3 } = require("../config/aws");

const router = express.Router();

/**
 * @swagger
 * /versioning/sync-s3:
 *   post:
 *     summary: Sync images in S3 based on predictions
 *     description: Move images from predicted species folders to labeled species folders in S3
 *     parameters:
 *       - in: query
 *         name: bucket
 *         required: true
 *         schema:
 *           type: string
 *         description: S3 bucket name
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, only shows what would be moved without actually moving
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 processed:
 *                   type: integer
 *                 moved:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                 actions:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/sync-s3", async (req, res) => {
  const { bucket, dryRun: dryRunParam = "false" } = req.query;

  // Convert string to boolean properly
  const dryRun = dryRunParam === "true" || dryRunParam === true;

  const syncStartTime = Date.now();

  console.log(`🔄 [SYNC] Starting S3 sync operation`);
  console.log(`📦 [SYNC] Bucket: ${bucket}`);
  console.log(`🧪 [SYNC] Dry run: ${dryRun}`);
  console.log(
    `🔍 [SYNC] Dry run param received: "${dryRunParam}" (type: ${typeof dryRunParam})`
  );
  console.log(`⏰ [SYNC] Start time: ${new Date().toISOString()}`);

  if (!bucket) {
    console.log(`❌ [SYNC] Error: Bucket name is required`);
    return res.status(400).json({ error: "Bucket name is required" });
  }

  try {
    // Get all predictions where predicted_specie_id != labeled_specie_id
    console.log(`🔍 [SYNC] Querying database for mismatched predictions...`);
    const query = `
      SELECT 
        p.tree_id,
        p.predicted_specie_id,
        p.labeled_specie_id,
        ps.common_name ->> 'en' AS predicted_common_name,
        ls.common_name ->> 'en' AS labeled_common_name,
        i.name AS image_name,
        i.name_compressed AS compressed_image_name
      FROM predictions p
      JOIN trees_images ti ON ti.tree_id = p.tree_id
      JOIN images i ON i.id = ti.image_id
      LEFT JOIN species ps ON ps.id = p.predicted_specie_id
      LEFT JOIN species ls ON ls.id = p.labeled_specie_id
      WHERE p.predicted_specie_id != p.labeled_specie_id
        AND p.labeled_specie_id IS NOT NULL
        AND p.predicted_specie_id IS NOT NULL
    `;

    const result = await db.query(query);
    const predictions = result.rows;

    console.log(
      `📊 [SYNC] Found ${predictions.length} predictions with mismatched species`
    );

    // Debug: Show first few predictions
    if (predictions.length > 0) {
      console.log(`🔍 [SYNC] Sample predictions (first 3):`);
      predictions.slice(0, 3).forEach((pred, index) => {
        console.log(`  ${index + 1}. Tree ${pred.tree_id}:`);
        console.log(
          `     Predicted: "${pred.predicted_common_name}" (ID: ${pred.predicted_specie_id})`
        );
        console.log(
          `     Labeled: "${pred.labeled_common_name}" (ID: ${pred.labeled_specie_id})`
        );
        console.log(`     Image: ${pred.image_name}`);
      });
    }

    let processed = 0;
    let moved = 0;
    let skipped = 0;
    let errors = [];
    let actions = [];

    for (const prediction of predictions) {
      processed++;

      const {
        tree_id,
        predicted_common_name,
        labeled_common_name,
        image_name,
        compressed_image_name,
      } = prediction;

      console.log(
        `\n🌳 [SYNC] Processing tree ${tree_id} (${processed}/${predictions.length})`
      );
      console.log(`📸 [SYNC] Image: ${image_name}`);
      console.log(
        `🤖 [SYNC] Predicted: "${predicted_common_name}" (ID: ${prediction.predicted_specie_id})`
      );
      console.log(
        `🏷️ [SYNC] Labeled: "${labeled_common_name}" (ID: ${prediction.labeled_specie_id})`
      );

      // Skip if species names are missing
      if (!predicted_common_name || !labeled_common_name) {
        console.log(
          `⚠️ [SYNC] Skipping tree ${tree_id} - missing species names`
        );
        skipped++;
        continue;
      }

      // Use original species names as folder names
      const predictedFolder = predicted_common_name;
      const labeledFolder = labeled_common_name;

      // S3 path structure: images2/[species]/[image]
      const s3Prefix = "images2";

      console.log(`📁 [SYNC] Source folder: "${predictedFolder}"`);
      console.log(`📁 [SYNC] Destination folder: "${labeledFolder}"`);

      // Check if folders are the same
      if (predictedFolder === labeledFolder) {
        console.log(
          `🔄 [SYNC] Folders are identical - no move needed for tree ${tree_id}`
        );
        actions.push({
          tree_id,
          image_name,
          from: `${s3Prefix}/${predictedFolder}/${image_name}`,
          to: `${s3Prefix}/${labeledFolder}/${image_name}`,
          predicted_species: predicted_common_name,
          labeled_species: labeled_common_name,
          action: "no_move_needed_same_folder",
        });
        skipped++;
        continue;
      }

      // Define source and destination paths
      const imagesToMove = [
        {
          name: image_name,
          source: `${s3Prefix}/${predictedFolder}/${image_name}`,
          destination: `${s3Prefix}/${labeledFolder}/${image_name}`,
        },
      ];

      // Add compressed image if it exists
      if (compressed_image_name) {
        imagesToMove.push({
          name: compressed_image_name,
          source: `${s3Prefix}/${predictedFolder}/${compressed_image_name}`,
          destination: `${s3Prefix}/${labeledFolder}/${compressed_image_name}`,
        });
        console.log(
          `📷 [SYNC] Also processing compressed image: ${compressed_image_name}`
        );
      }

      // Process each image
      for (const imageInfo of imagesToMove) {
        console.log(`\n📋 [SYNC] Processing image: ${imageInfo.name}`);
        console.log(`🔄 [SYNC] From: ${imageInfo.source}`);
        console.log(`🎯 [SYNC] To: ${imageInfo.destination}`);

        try {
          const action = {
            tree_id,
            image_name: imageInfo.name,
            from: imageInfo.source,
            to: imageInfo.destination,
            predicted_species: predicted_common_name,
            labeled_species: labeled_common_name,
          };

          if (dryRun) {
            console.log(`🧪 [SYNC] DRY RUN: Would move ${imageInfo.name}`);
            actions.push({ ...action, action: "would_move" });
          } else {
            // Check if source object exists
            console.log(`🔍 [SYNC] Checking if source exists in S3...`);
            console.log(
              `🔍 [SYNC] Source path: s3://${bucket}/${imageInfo.source}`
            );

            try {
              const headResult = await s3
                .headObject({
                  Bucket: bucket,
                  Key: imageInfo.source,
                })
                .promise();
              console.log(`✅ [SYNC] Source exists: ${imageInfo.source}`);
              console.log(
                `📊 [SYNC] Source size: ${headResult.ContentLength} bytes`
              );
              console.log(
                `📅 [SYNC] Source last modified: ${headResult.LastModified}`
              );
            } catch (err) {
              if (err.code === "NotFound") {
                console.log(`❌ [SYNC] Source not found: ${imageInfo.source}`);
                actions.push({ ...action, action: "source_not_found" });
                skipped++;
                continue;
              }
              console.log(`⚠️ [SYNC] Error checking source: ${err.message}`);
              throw err;
            }

            // Copy object to new location
            console.log(`📋 [SYNC] Copying to destination...`);
            console.log(
              `📋 [SYNC] Destination path: s3://${bucket}/${imageInfo.destination}`
            );

            try {
              const copyResult = await s3
                .copyObject({
                  Bucket: bucket,
                  CopySource: `${bucket}/${imageInfo.source}`,
                  Key: imageInfo.destination,
                })
                .promise();
              console.log(`✅ [SYNC] Copied successfully`);
              console.log(`🔄 [SYNC] Copy ETag: ${copyResult.ETag}`);
            } catch (copyErr) {
              console.log(`❌ [SYNC] Copy failed: ${copyErr.message}`);
              throw copyErr;
            }

            // Delete original object
            console.log(`🗑️ [SYNC] Deleting source...`);
            try {
              const deleteResult = await s3
                .deleteObject({
                  Bucket: bucket,
                  Key: imageInfo.source,
                })
                .promise();
              console.log(`✅ [SYNC] Deleted source successfully`);
              console.log(
                `🗑️ [SYNC] Delete version: ${deleteResult.VersionId || "N/A"}`
              );
            } catch (deleteErr) {
              console.log(`❌ [SYNC] Delete failed: ${deleteErr.message}`);
              console.log(
                `⚠️ [SYNC] File was copied but not deleted from source`
              );
            }

            actions.push({ ...action, action: "moved" });
            moved++;
            console.log(`🎉 [SYNC] Successfully moved ${imageInfo.name}`);
          }
        } catch (error) {
          console.log(
            `💥 [SYNC] Error processing ${imageInfo.name}: ${error.message}`
          );
          console.error(`💥 [SYNC] Full error:`, error);
          errors.push({
            tree_id,
            image_name: imageInfo.name,
            error: error.message,
          });
        }
      }
    }

    const syncEndTime = Date.now();
    const syncDuration = syncEndTime - syncStartTime;

    console.log(`\n📊 [SYNC] === SYNC OPERATION COMPLETED ===`);
    console.log(
      `⏱️ [SYNC] Duration: ${syncDuration}ms (${(syncDuration / 1000).toFixed(
        2
      )}s)`
    );
    console.log(`📈 [SYNC] Processed: ${processed}`);
    console.log(`✅ [SYNC] Moved: ${moved}`);
    console.log(`⏭️ [SYNC] Skipped: ${skipped}`);
    console.log(`❌ [SYNC] Errors: ${errors.length}`);
    console.log(`🔄 [SYNC] Actions: ${actions.length}`);

    if (errors.length > 0) {
      console.log(`💥 [SYNC] Errors details:`);
      errors.forEach((error, index) => {
        console.log(
          `  ${index + 1}. Tree ${error.tree_id} - ${error.image_name}: ${
            error.error
          }`
        );
      });
    }

    const finalMessage = dryRun ? "Dry run completed" : "S3 sync completed";
    console.log(`🏁 [SYNC] ${finalMessage}`);

    res.json({
      message: finalMessage,
      processed,
      moved,
      skipped,
      errors,
      actions,
      duration: syncDuration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const syncEndTime = Date.now();
    const syncDuration = syncEndTime - syncStartTime;

    console.error(`💥 [SYNC] FATAL ERROR after ${syncDuration}ms:`, error);
    console.error(`💥 [SYNC] Error stack:`, error.stack);
    res.status(500).json({
      error: `S3 sync error: ${error.message}`,
      duration: syncDuration,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
