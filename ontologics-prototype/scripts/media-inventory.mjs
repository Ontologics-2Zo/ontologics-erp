/** Rebuild local design-review inventories from the same immutable IDs and media resolver as the UI.
 * Reads src/public only; writes docs/media-*.csv and docs/media-inventory-summary.json.
 * Run from this project: node scripts/media-inventory.mjs
 */
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {readFile, writeFile, mkdir, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, 'docs');
// Use Vite's installed esbuild transformer in memory; no listener, cache or application writes.
const bundle = await build({stdin:{contents:"export * from './src/entity-data.ts'; export * from './src/media-data.ts';",resolveDir:root,sourcefile:'media-inventory-entry.ts',loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,logLevel:'error'});
const registry = await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const countBy = (rows, key) => rows.reduce((out,row) => {const value=String(typeof key==='function'?key(row):row[key]);out[value]=(out[value]??0)+1;return out;},{});
const csv = (rows, columns) => '\uFEFF'+[columns,...rows.map(row=>columns.map(column=>row[column]??''))].map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
try {
  const {entities,snapshots,mediaAssets,mediaBindings,resolveEntityMedia} = registry;
  const rawBom=JSON.parse(await readFile(resolve(root,'src/bom-source.json'),'utf8'));
  const duplicateIds=entities.filter((entity,index)=>entities.findIndex(other=>other.id===entity.id)!==index).map(entity=>entity.id);
  if(duplicateIds.length)throw new Error('Duplicate immutable entity IDs: '+duplicateIds.join(', '));
  const rawById=new Map(Object.entries(rawBom).flatMap(([revision,rows])=>rows.filter(row=>row.row>2).map(row=>[`PART-POE-${revision}-${row.row}`,{revision,row:row.row,designation:row.cells[1],package:row.cells[2],position:row.cells[3]}])));
  const assetRows=await Promise.all(Object.values(mediaAssets).map(async asset=>{
    const localPath=asset.url.startsWith('/')?resolve(root,'public',asset.url.slice(1)):null;
    let exists=false,bytes='',sha256='';
    if(localPath)try{const file=await readFile(localPath);exists=(await stat(localPath)).isFile();bytes=file.length;sha256=createHash('sha256').update(file).digest('hex');}catch{/* Missing asset is a reported state, never invented. */}
    return {...asset,file_exists:exists,bytes,sha256,binding_count:Object.values(mediaBindings).filter(binding=>binding.assetId===asset.assetId).length};
  }));
  const assetById=new Map(assetRows.map(asset=>[asset.assetId,asset]));
  function row(entity){
    const media=resolveEntityMedia(entity),raw=rawById.get(entity.id),asset=media&&assetById.get(media.assetId);
    return {id:entity.id,type:entity.type,name:entity.name,company:entity.company,revision:entity.revision,data_source:entity.source,data_evidence:entity.evidence.join(' | '),raw_designation:raw?.designation??'',raw_package:raw?.package??entity.properties['패키지']??'',source_row:raw?.row??'',position:raw?.position??'',media_kind:media?.kind??'unregistered',asset_id:media?.assetId??'',media_url:media?.url??'',media_subject:media?.subject??'',media_source:media?.source??'',media_source_url:media?.sourceUrl??'',scope:media?.scope??'',revision_match:media?.revisionMatch??'',evidence_eligible:media?.evidenceEligible??false,file_exists:asset?.file_exists??false,unregistered_reason:media?'':raw&&(/SJ/.test(raw.package)||/^Opened/.test(raw.designation))?'솔더 점퍼/보드 설정 · 별도 부품 사진 대상 아님':'검수 또는 종류별 참고 자산 미등록'};
  }
  const boardRows=entities.filter(entity=>['제품 모델','확보 대상 모델'].includes(entity.type)).map(row);
  const partRows=entities.filter(entity=>['BOM 원문 품목','사내 품목'].includes(entity.type)).map(row);
  const packageRows=Object.entries(countBy([...rawById.values()],'package')).sort(([a],[b])=>a.localeCompare(b)).map(([packageName,count])=>({raw_package:packageName,part_ids:count,media_assets:[...new Set(partRows.filter(part=>part.raw_package===packageName).map(part=>part.asset_id||'unregistered'))].join(' | '),media_kinds:[...new Set(partRows.filter(part=>part.raw_package===packageName).map(part=>part.media_kind))].join(' | ')}));
  const unknownBindings=Object.keys(mediaBindings).filter(id=>!entities.some(entity=>entity.id===id));
  const missingFiles=assetRows.filter(asset=>!asset.file_exists).map(asset=>asset.assetId);
  const summary={generated_at:new Date().toISOString(),scope:'Local company-A fixture registry; not a production tenant aggregate or manufacturer part master. Immutable IDs are never merged by name.',board_models:{total:boardRows.length,by_data_source:countBy(boardRows,'data_source'),by_media_kind:countBy(boardRows,'media_kind')},parts:{total:partRows.length,by_data_source:countBy(partRows,'data_source'),by_media_kind:countBy(partRows,'media_kind'),actual_bom_ids:rawById.size,actual_designation_exact_unique:new Set([...rawById.values()].map(row=>row.designation)).size,actual_designation_whitespace_normalized_unique:new Set([...rawById.values()].map(row=>row.designation.replace(/\s+/g,'').trim())).size,raw_package_keys:packageRows.length,unregistered:partRows.filter(part=>part.media_kind==='unregistered').map(part=>({id:part.id,package:part.raw_package,reason:part.unregistered_reason}))},snapshots:{total:snapshots.length,by_data_source:countBy(snapshots,'source')},assets:{total:assetRows.length,by_media_kind:countBy(assetRows,'kind'),bindings:Object.keys(mediaBindings).length,unique_files:new Set(assetRows.map(asset=>asset.url)).size,missing_files:missingFiles,unknown_entity_bindings:unknownBindings},evidence_eligible_assets:assetRows.filter(asset=>asset.evidenceEligible).length};
  await mkdir(destination,{recursive:true});
  const entityColumns=['id','type','name','company','revision','data_source','data_evidence','raw_designation','raw_package','source_row','position','media_kind','asset_id','media_url','media_subject','media_source','media_source_url','scope','revision_match','evidence_eligible','file_exists','unregistered_reason'];
  await Promise.all([
    writeFile(resolve(destination,'media-board-inventory.csv'),csv(boardRows,entityColumns)),
    writeFile(resolve(destination,'media-part-inventory.csv'),csv(partRows,entityColumns)),
    writeFile(resolve(destination,'media-asset-inventory.csv'),csv(assetRows,['assetId','kind','subject','url','source','sourceUrl','createdAt','rights','evidenceEligible','file_exists','bytes','sha256','binding_count'])),
    writeFile(resolve(destination,'media-package-inventory.csv'),csv(packageRows,['raw_package','part_ids','media_assets','media_kinds'])),
    writeFile(resolve(destination,'media-inventory-summary.json'),JSON.stringify(summary,null,2)+'\n')
  ]);
  console.log(JSON.stringify({board_models:summary.board_models,parts:{total:partRows.length,by_media_kind:summary.parts.by_media_kind},assets:summary.assets},null,2));
  if(missingFiles.length||unknownBindings.length)process.exitCode=1;
} catch(error) {console.error(error); process.exitCode=1;}
