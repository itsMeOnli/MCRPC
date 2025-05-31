// lib/zip-utils.js
const fsp = require("fs/promises");
const fs = require("fs"); // For createWriteStream and other standard fs operations
const path = require("path");
const yauzl = require("yauzl");
const archiver = require("archiver");

/**
 * Unzips a single ZIP file into a destination directory.
 * Overwrites existing files if conflict.
 * @param {string} zipFilePath - Path to the input ZIP file.
 * @param {string} destinationDir - Directory where contents will be extracted.
 * @returns {Promise<void>}
 */

async function unzipAndExtract(zipFilePath, destinationDir) {
  console.log(`Unzipping ${zipFilePath} to ${destinationDir}`);
  await fsp.mkdir(destinationDir, { recursive: true });

  return new Promise((resolve, reject) => {
    yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        console.error(`Error opening zip file ${zipFilePath}:`, err);
        return reject(err);
      }

      zipfile.on("entry", async (entry) => {
        const entryPath = path.join(destinationDir, entry.fileName);

        // If it's a directory, create it
        if (/\/$/.test(entry.fileName)) {
          await fsp.mkdir(entryPath, { recursive: true });
          zipfile.readEntry(); // Read the next entry
        } else {
          // If it's a file, ensure its parent directory exists and then extract
          await fsp.mkdir(path.dirname(entryPath), { recursive: true });

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              zipfile.close();
              return reject(err);
            }

            const writeStream = fs.createWriteStream(entryPath);
            readStream.pipe(writeStream);

            readStream.on("end", () => {
              zipfile.readEntry();
            });
            readStream.on("error", (err) => {
              console.error(
                `Error reading stream for ${entry.fileName}:`,
                err
              );
              zipfile.close();
              reject(err);
            });
            writeStream.on("error", (err) => {
              console.error(
                `Error writing stream for ${entry.fileName}:`,
                err
              );
              zipfile.close();
              reject(err);
            });
          });
        }
      });

      zipfile.on("end", () => {
        console.log(`Finished unzipping ${zipFilePath}`);
        resolve();
      });

      zipfile.on("error", (err) => {
        console.error(`Error during unzipping ${zipFilePath}:`, err);
        reject(err);
      });

      zipfile.readEntry(); // Start reading entries
    });
  });
}

/**
 * Copies all files and directories from a source path to a destination path,
 * overwriting existing files in the destination.
 * This simulates the "merging" logic.
 * @param {string} sourcePath - The directory to copy FROM.
 * @param {string} destinationPath - The directory to copy TO.
 * @returns {Promise<void>}
 */
async function mergeDirectories(sourcePath, destinationPath) {
  console.log(`Merging from ${sourcePath} to ${destinationPath}`);
  await fsp.mkdir(destinationPath, { recursive: true });

  const files = await fsp.readdir(sourcePath, { withFileTypes: true });

  for (const file of files) {
    const srcFullPath = path.join(sourcePath, file.name);
    const destFullPath = path.join(destinationPath, file.name);

    if (file.isDirectory()) {
      // Recursively merge subdirectories
      await mergeDirectories(srcFullPath, destFullPath);
    } else {
      // It's a file, copy and overwrite
      await fsp.copyFile(srcFullPath, destFullPath);
    }
  }
  console.log(`Finished merging ${sourcePath}`);
}

/**
 * Creates a ZIP archive from the contents of a source directory.
 * @param {string} sourceDirectory - The directory to zip.
 * @param {string} outputZipFilePath - The full path for the output ZIP file.
 * @returns {Promise<void>}
 */
async function createZipArchive(sourceDirectory, outputZipFilePath) {
  console.log(`Creating ZIP archive from ${sourceDirectory} to ${outputZipFilePath}`);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      console.log(
        `Archive finalized. Total bytes: ${archive.pointer()}`
      );
      resolve();
    });

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn("Archiver warning:", err.message);
      } else {
        reject(err);
      }
    });

    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      reject(err);
    });

    archive.pipe(output);

    // Append files from a directory, including subdirectories.
    // The second argument `false` means the root of the sourceDirectory
    // becomes the root of the zip file.
    archive.directory(sourceDirectory, false);

    archive.finalize();
  });
}

module.exports = {
  unzipAndExtract,
  mergeDirectories,
  createZipArchive,
};