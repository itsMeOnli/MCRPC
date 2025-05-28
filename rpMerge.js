const {
  unzipAndExtract,
  mergeDirectories,
  createZipArchive,
} = require("./lib/zip-utils");
const fs = require("fs/promises");
const path = require("path");

async function runTest() {
  const testFilesDir = path.join(__dirname, "packs");
  const tempWorkDir = path.join(__dirname, "tmp");
  const mergedDir = path.join(tempWorkDir, "merged_output");
  const outputZipPath = path.join(tempWorkDir, "combined_pack.zip");

  const pack1Path = path.join(testFilesDir, "1.zip");
  const pack2Path = path.join(testFilesDir, "2.zip");

try {
    await fs.rm(tempWorkDir, { recursive: true, force: true });
    await fs.mkdir(tempWorkDir, { recursive: true });
    await fs.mkdir(mergedDir, { recursive: true }); // Ensure merged output dir exists

    console.log("--- Starting Test ---");

    // 1. Unzip Pack 1 and merge it into the merged directory
    const pack1UnzippedDir = path.join(tempWorkDir, "pack1_unzipped");
    await unzipAndExtract(pack1Path, pack1UnzippedDir);
    await mergeDirectories(pack1UnzippedDir, mergedDir);
    await fs.rm(pack1UnzippedDir, { recursive: true, force: true }); // Clean up temp unzipped dir

    // 2. Unzip Pack 2 and merge it into the merged directory (overwriting conflicts)
    const pack2UnzippedDir = path.join(tempWorkDir, "pack2_unzipped");
    await unzipAndExtract(pack2Path, pack2UnzippedDir);
    await mergeDirectories(pack2UnzippedDir, mergedDir);
    await fs.rm(pack2UnzippedDir, { recursive: true, force: true }); // Clean up temp unzipped dir

    // 3. Create the final combined ZIP
    await createZipArchive(mergedDir, outputZipPath);

    console.log(`\nSuccessfully created combined pack at: ${outputZipPath}`);
    console.log("You can inspect the contents of the zip or the temp_work/merged_output folder.");
  } catch (error) {
    console.error("\n--- Test Failed ---");
    console.error(error);
  } finally {
    // Optional: Keep temp_work for inspection after test, or clean it up here
    // await fs.rm(tempWorkDir, { recursive: true, force: true });
    // console.log("Cleaned up temporary directories.");
  }
}

runTest();
