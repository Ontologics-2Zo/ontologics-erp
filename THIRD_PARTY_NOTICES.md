# Third-party material

## OLIMEX ESP32-POE BOM evidence

`ontologics-prototype/public/evidence/` contains four unmodified ODS/PDF BOM originals from [OLIMEX/ESP32-POE at commit deb38a377d50eadb04ddc7118a17a5ae58b1ee53](https://github.com/OLIMEX/ESP32-POE/tree/deb38a377d50eadb04ddc7118a17a5ae58b1ee53). Attribution: OLIMEX. Original paths, source URLs and SHA-256 values are preserved in `public/evidence/catalog.json` and `docs/PROVENANCE.md` inside the app.

The [upstream license notice](https://github.com/OLIMEX/ESP32-POE/blob/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/README.md) distinguishes hardware ([Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)), software ([GPLv3](https://www.gnu.org/licenses/gpl-3.0.html)) and documentation ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)). Upstream rights and notices continue to apply; this import does not relicense those materials. The included BOM originals have not been modified.

## Manufacturer reference photos

The four OLIMEX board JPEGs are excluded from Git because the original delivery records mark their redistribution license as unconfirmed. Their source URLs, sizes and hashes are preserved in `ontologics-prototype/docs/reference-media.json`. Optional local restoration does not establish redistribution permission. Do not commit restored files or publish build output containing them without resolving their rights.

## Generated reference illustrations and dependencies

The other 28 reference illustrations retain their existing AI-generated provenance and prompts. Personal absolute paths in the generation metadata have been reduced to original image basenames. These illustrations are not engineering or inspection evidence.

Third-party npm packages remain governed by their respective licenses; dependency versions are preserved in the existing `package-lock.json`. This notice does not choose a license for the project's own code.
