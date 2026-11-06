"""Verify and import the five fixed BOM snapshots from the supplied v1.7 package.

Usage: python3 scripts/import-actual-boms.py --input /path/to/v1.7.zip [--check]
The input can also be the extracted handoff root (containing data/).
No network, formula execution, inference, source changes, or approval is performed.
"""
from pathlib import Path, PurePosixPath
import argparse
import csv
import hashlib
import io
import json
import re
import zipfile
import xml.etree.ElementTree as ET

APP = Path(__file__).resolve().parents[1]
SPECS = [
    ('L', 'POE-L-WROOM', 'MODEL-POE', 'CFG-POE-L', 'ESP32-PoE', 'SRC-L-ods', 'PART-POE-L', 'L-WROOM.ods'),
    ('L1', 'POE-L1-WROOM', 'MODEL-POE', 'CFG-POE-L1', 'ESP32-PoE', 'SRC-L1-ods', 'PART-POE-L1', 'L1-WROOM.ods'),
    ('ISO-N', 'ESP32-POE-ISO-N', 'MODEL-POEISO', 'CFG-POEISO-N', 'ESP32-POE-ISO', 'SRC-ISO-N-csv', 'PART-POEISO-N', 'ESP32-PoE-ISO_Rev_N_BOM.csv'),
    ('EVB-C', 'ESP32-EVB-C', 'MODEL-EVB', 'CFG-EVB-C', 'ESP32-EVB', 'SRC-EVB-C-csv', 'PART-EVB-C', 'ESP32-EVB_Rev_C.csv'),
    ('GATEWAY-I', 'ESP32-GATEWAY-I', 'MODEL-GATEWAY', 'CFG-GATEWAY-I', 'ESP32-GATEWAY', 'SRC-GATEWAY-I-csv', 'PART-GATEWAY-I', 'ESP32-GATEWAY_Rev_I_BOM.csv'),
]
T = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'
X = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_ods(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        info = z.getinfo('content.xml')
        if info.file_size > 8_000_000:
            raise ValueError('Oversized ODS XML')
        xml = z.read('content.xml')
    if b'<!DOCTYPE' in xml or b'<!ENTITY' in xml:
        raise ValueError('XML entities are not supported')
    root = ET.fromstring(xml)
    # These fixed documents contain no explicit text-space/tab/line-break nodes.
    # Fail rather than silently changing a future document with different encoding.
    if any(root.findall('.//{' + X + '}' + tag) for tag in ['s', 'tab', 'line-break']):
        raise ValueError('ODS explicit whitespace requires parser review')
    result = []
    for sheet in root.findall('.//{' + T + '}table'):
        label = sheet.get('{' + T + '}name', '')
        n = 0
        header = None
        for row in sheet.findall('{' + T + '}table-row'):
            repeat = int(row.get('{' + T + '}number-rows-repeated', '1'))
            n += repeat
            cells = []
            for cell in row:
                if cell.tag not in ['{' + T + '}table-cell', '{' + T + '}covered-table-cell']:
                    continue
                if cell.get('{' + T + '}formula'):
                    raise ValueError('Formula cells require review')
                value = ' '.join(''.join(p.itertext()) for p in cell.findall('.//{' + X + '}p'))
                count = int(cell.get('{' + T + '}number-columns-repeated', '1'))
                if value and count > 512:
                    raise ValueError('Oversized filled cell repeat')
                cells.extend([value] * min(count, 512))
            if not any(cells):
                continue
            if repeat != 1:
                raise ValueError('Filled row repeat requires review')
            if 'Quantity' in cells and 'Designation' in cells:
                header = cells
                continue
            if not header or not cells[0].isdigit():
                raise ValueError('Unexpected filled source row')
            fields = {key: cells[i] if i < len(cells) else '' for i, key in enumerate(header) if key}
            result.append((n, label, f'{label}!row={n}', cells, fields))
    return result


def read_csv(data):
    reader = csv.reader(io.StringIO(data.decode('utf-8-sig')), delimiter=';')
    header = next(reader)
    result = []
    for row, cells in enumerate(reader, 2):
        if not any(cells):
            continue
        if len(cells) < 6:
            raise ValueError('Incomplete CSV row')
        result.append((row, '', f'line={row}', cells, {key: cells[i] for i, key in enumerate(header) if key}))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    archive = zipfile.ZipFile(args.input) if args.input.is_file() else None
    if archive:
        manifests = [n for n in archive.namelist() if n.endswith('/data/source_manifest.json')]
        if len(manifests) != 1:
            raise ValueError('Expected exactly one source manifest')
        prefix = manifests[0][:-len('data/source_manifest.json')]
    else:
        prefix = ''

    def read(name):
        if PurePosixPath(name).is_absolute() or '..' in PurePosixPath(name).parts:
            raise ValueError('Invalid package path')
        data = archive.read(prefix + name) if archive else (args.input / name).read_bytes()
        if len(data) > 8_000_000:
            raise ValueError('Oversized fixed source')
        return data

    manifest = json.loads(read('data/source_manifest.json'))
    snapshots = {s['snapshot_id']: s for s in manifest['snapshots']}
    output = []
    writes = {}
    catalog = json.loads((APP / 'src/catalog.json').read_text())
    for key, snapshot_id, model_id, cfg_id, model, source_id, part_prefix, filename in SPECS:
        source = snapshots[snapshot_id]
        if source['raw_path'] != 'raw/' + filename:
            raise ValueError('Unexpected raw source path')
        raw = read('data/raw/' + filename)
        blob = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
        if sha(raw) != source['sha256'] or blob != source['git_blob_sha1'] or len(raw) != source['bytes']:
            raise ValueError('Source integrity mismatch: ' + snapshot_id)
        normalized = json.loads(read('data/normalized/' + snapshot_id + '.json'))
        parsed = read_ods(raw) if source['format'] == 'ods' else read_csv(raw)
        if len(parsed) != len(normalized['rows']):
            raise ValueError('Missing normalized rows')
        lines = []
        for ordinal, ((row, sheet, locator, cells, fields), candidate) in enumerate(zip(parsed, normalized['rows']), 1):
            if cells != candidate['raw_cells'] or fields != candidate['raw_fields'] or locator != candidate['locator']:
                raise ValueError('Raw and normalized row mismatch: ' + snapshot_id + ':' + str(row))
            quantity = int(fields['Quantity']) if re.fullmatch(r'\d+', fields['Quantity']) else None
            references = [r.strip() for r in fields['Designator'].split(',') if r.strip()]
            if quantity != candidate['source_quantity'] or references != candidate['reference_tokens']:
                raise ValueError('Parsed quantity/reference mismatch')
            if candidate['population_status'] != 'unreviewed' or candidate['quantity_unit'] is not None:
                raise ValueError('Unexpected engineering approval; requires separate review')
            expected_id = f'{snapshot_id}:{source["sha256"][:12]}:{ordinal}'
            if candidate['source_row_id'] != expected_id or candidate['source_sha256'] != source['sha256']:
                raise ValueError('Source identity mismatch')
            lines.append({
                'row': row, 'sheet': sheet,
                'cells': [fields['Quantity'], fields['Designation'], fields.get('Package', fields.get('Footprint', '')), fields['Designator']],
                'sourceRowId': expected_id, 'sourceOrdinal': ordinal, 'locator': locator,
                'rawFields': fields, 'rawCells': cells, 'referenceTokens': references,
                'sourceQuantity': quantity, 'quantityUnit': None, 'populationStatus': 'unreviewed',
                'reviewStatus': 'not_independently_reviewed', 'categoryHint': candidate['category_hint'],
                'warnings': candidate['warnings'],
            })
        output.append({
            'key': key, 'modelId': model_id, 'configurationId': cfg_id, 'modelName': model,
            'revision': source['revision'], 'sourceId': source_id, 'partPrefix': part_prefix,
            'lines': lines,
            'source': {'snapshotId': snapshot_id, 'format': source['format'], 'localPath': '/evidence/' + filename,
                       'url': source['source_url'], 'sha256': source['sha256'], 'gitBlobSha1': source['git_blob_sha1'],
                       'repository': source['repository'], 'repositoryPath': source['repository_path'],
                       'commit': source['commit'], 'acquisition': source['acquisition']},
            'worksheetLabels': normalized['summary']['worksheet_labels'],
            'warnings': sorted({w for line in lines for w in line['warnings']}),
        })
        if source['format'] == 'csv':
            writes['public/evidence/' + filename] = raw
            entry = {'id': source_id, 'revision': source['revision'], 'filename': filename,
                     'path': source['repository_path'], 'url': source['source_url'], 'local': '/evidence/' + filename,
                     'sha256': source['sha256'], 'kind': '실제 공개 원본', 'commit': source['commit']}
            catalog = [c for c in catalog if c['id'] != source_id] + [entry]
        elif (APP / 'public/evidence' / filename).read_bytes() != raw:
            raise ValueError('Existing ODS differs; refusing to overwrite')
    writes['src/actual-bom-data.json'] = (json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    writes['src/catalog.json'] = (json.dumps(catalog, ensure_ascii=False, indent=2) + '\n').encode()
    # The public evidence index and the imported UI index describe the same originals.
    writes['public/evidence/catalog.json'] = writes['src/catalog.json']
    for name, data in writes.items():
        path = APP / name
        if args.check:
            if not path.exists() or path.read_bytes() != data:
                raise ValueError('Generated file differs: ' + name)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            if not path.exists() or path.read_bytes() != data:
                path.write_bytes(data)
    print(json.dumps({'snapshots': len(output), 'rows': sum(len(s['lines']) for s in output),
                      'source_hashes_verified': len(output), 'files_checked' if args.check else 'files_written': len(writes),
                      'engineering_approval': False}))


if __name__ == '__main__':
    main()
