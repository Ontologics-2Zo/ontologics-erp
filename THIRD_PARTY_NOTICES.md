# Third-party material

## OLIMEX ESP32-POE BOM evidence

`ontologics-prototype/public/evidence/` contains four unmodified ODS/PDF BOM originals from [OLIMEX/ESP32-POE at commit deb38a377d50eadb04ddc7118a17a5ae58b1ee53](https://github.com/OLIMEX/ESP32-POE/tree/deb38a377d50eadb04ddc7118a17a5ae58b1ee53). Attribution: OLIMEX. Original paths, source URLs and SHA-256 values are preserved in `public/evidence/catalog.json` and `docs/PROVENANCE.md` inside the app.

The [upstream license notice](https://github.com/OLIMEX/ESP32-POE/blob/deb38a377d50eadb04ddc7118a17a5ae58b1ee53/README.md) distinguishes hardware ([Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)), software ([GPLv3](https://www.gnu.org/licenses/gpl-3.0.html)) and documentation ([CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)). Upstream rights and notices continue to apply; this import does not relicense those materials. The included BOM originals have not been modified.

## Manufacturer reference photos

The four OLIMEX board JPEGs are excluded from Git because the original delivery records mark their redistribution license as unconfirmed. Their source URLs, sizes and hashes are preserved in `ontologics-prototype/docs/reference-media.json`. Optional local restoration does not establish redistribution permission. Do not commit restored files or publish build output containing them without resolving their rights.

## Generated reference illustrations and dependencies

The other 28 reference illustrations retain their existing AI-generated provenance and prompts. Personal absolute paths in the generation metadata have been reduced to original image basenames. These illustrations are not engineering or inspection evidence.

Third-party npm packages remain governed by their respective licenses; dependency versions are preserved in the existing `package-lock.json`. This notice does not choose a license for the project's own code.

## v1.7 additional BOM originals

Attribution: OLIMEX. Three unmodified CSV files supplied in the v1.7 package are preserved, including original delimiters/newlines. Exact paths, pinned commit/blob identifiers and SHA-256 values are in `ontologics-prototype/src/actual-bom-data.json`, `src/catalog.json` and `public/evidence/catalog.json`.

- ESP32-POE-ISO N: repository `OLIMEX/ESP32-POE-ISO`, commit `c19307ecd8a9d8c5703de7a1571cd89945e39c01`.
- ESP32-EVB C: repository `OLIMEX/ESP32-EVB`, commit `a3ec2f448109cb8f35ce7cb21a027bb7c837ab61`.
- ESP32-GATEWAY I: repository `OLIMEX/ESP32-GATEWAY`, commit `d45c9bc8120534b130a4f8bb8fa6cd3dc78e4ea0`.

The supplied `THIRD_PARTY_SOURCES.md` records CERN OHL v1.2 for ISO and separate hardware/software/documentation notices for Gateway; file-level scope review was not completed by that handoff. Upstream copyright and applicable terms remain in effect. This alignment does not relicense the files or certify manufacturing suitability. The normalized JSON preserves original source locators and uncertainty; source acquisition is not MPN, population, or compatibility approval. The four manufacturer photos remain excluded from Git under the existing restoration policy.
