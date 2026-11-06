import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {actualBomList,actualBoms,actualPartId,actualBomForSource} from '../src/actual-boms';
import {entities,snapshots,relations,entityById} from '../src/entity-data';
import legacy from '../src/bom-source.json';
import catalog from '../src/catalog.json';
import {resolveEntityMedia} from '../src/media-data';

const expected=[
 ['L',74,128,'ef4f04d46ca8f3961f6ac528320011679a14c57007717b5972c32551e9c51a5e'],
 ['L1',74,128,'773c8b3fb0fa9f9c354586d12fd6bffd02b156b94d07e23e671c1205ab918e95'],
 ['ISO-N',75,138,'a3a3af329d7fa1e6e86a92badfde1c189513a76c2510d31d3f5bfcd7e93b472c'],
 ['EVB-C',71,155,'aad5f832c81f6ae1ebdb169cf482f02f538944078bb2d7242b52eed619b82ab6'],
 ['GATEWAY-I',62,111,'ec160e7d7d9dfc8e1673e9e8f15df7d8d4314d49c05f8dcface38e81acaa3247'],
] as const;

describe('v1.7 actual BOM source alignment',()=>{
 it.each(expected)('%s 원본 bytes/hash·행·수량·locator가 일치하고 공통 객체로 연결', (key,count,sum,hash)=>{
  const bom=actualBoms[key],source=catalog.find(s=>s.id===bom.sourceId)!;
  const raw=readFileSync(resolve(import.meta.dirname,'../public','.'+source.local));
  expect(createHash('sha256').update(raw).digest('hex')).toBe(hash);
  expect(source.sha256).toBe(hash);expect(bom.source.sha256).toBe(hash);
  expect(createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${raw.length}\0`),raw])).digest('hex')).toBe(bom.source.gitBlobSha1);
  expect(bom.lines).toHaveLength(count);
  expect(bom.lines.reduce((n,r)=>n+(r.sourceQuantity??0),0)).toBe(sum);
  const snapshot=snapshots.find(s=>s.id===bom.configurationId)!;
  expect(snapshot.lines).toHaveLength(count);
  for(const row of bom.lines){
   expect(row.cells).toHaveLength(4);
   expect(row.cells).toEqual([row.rawFields.Quantity,row.rawFields.Designation,row.rawFields.Package??row.rawFields.Footprint,row.rawFields.Designator]);
   const id=actualPartId(bom,row),line=snapshot.lines.find(l=>l.partId===id)!;
   expect(line.sourceRowId).toBe(row.sourceRowId);expect(line.sourceRow).toBe(row.row);
   expect(line.qty).toBe(row.sourceQuantity);expect(line.unit).toBe('미확인');
   expect(entityById(id)?.evidence).toContain(bom.sourceId);
   expect(relations.some(r=>r.from===bom.configurationId&&r.to===id&&r.type==='design')).toBe(true);
  }
 });
 it('4실제 모델·5실제 스냅샷·356원문행과 독립 합성 스냅샷을 구분하고 모든 ID가 고유',()=>{
  expect(new Set(actualBomList.map(b=>b.modelId)).size).toBe(4);
  expect(actualBomList).toHaveLength(5);
  const rows=actualBomList.flatMap(b=>b.lines);
  expect(rows).toHaveLength(356);expect(new Set(rows.map(r=>r.sourceRowId)).size).toBe(356);
  expect(new Set(entities.map(e=>e.id)).size).toBe(entities.length);
  expect(new Set(relations.map(r=>r.id)).size).toBe(relations.length);
  expect(snapshots.filter(s=>s.source==='실제 공개 원본')).toHaveLength(5);
  expect(snapshots.filter(s=>s.source==='합성 예시')).toHaveLength(3);
  for(const relation of relations){expect(entityById(relation.from),relation.id+' source').toBeDefined();expect(entityById(relation.to),relation.id+' target').toBeDefined();}
  for(const row of rows){expect(row.populationStatus).toBe('unreviewed');expect(row.quantityUnit).toBeNull();expect(row.reviewStatus).toBe('not_independently_reviewed');}
 });
 it('기존 L/L1 행 ID·비공백 원문을 보존하고 시트명 충돌을 숨기지 않음',()=>{
  for(const key of ['L','L1'] as const){
   const bom=actualBoms[key];
   for(const old of legacy[key].filter(r=>r.row>2)){
    const row=bom.lines.find(r=>r.row===old.row)!;
    expect(row.cells.map(s=>s.replace(/\s/g,''))).toEqual(old.cells.slice(0,4).map(s=>s.replace(/\s/g,'')));
    expect(actualPartId(bom,row)).toBe(`PART-POE-${key}-${old.row}`);
   }
   expect(bom.warnings).toContain('worksheet_label_context_conflict');
   expect(actualBomForSource(`SRC-${key}-pdf`)).toBe(bom);
  }
  expect(actualBoms.L.worksheetLabels).toEqual(['ESP32-PoE_Rev_J-BOM(WROVER)']);
 });
 it('CSV 첫행·빈 위치·쉼표·Ref** 중복 및 비조달/설정 후보를 별도 행으로 보존',()=>{
  for(const key of ['ISO-N','EVB-C','GATEWAY-I'] as const)expect(actualBoms[key].lines[0].row).toBe(2);
  const evb=actualBoms['EVB-C'];
  expect(evb.lines.filter(r=>!r.referenceTokens.length)).toHaveLength(5);
  const duplicate=evb.lines.filter(r=>r.referenceTokens.includes('Ref**'));
  expect(duplicate.map(r=>r.row)).toEqual([67,71]);
  expect(new Set(duplicate.map(r=>actualPartId(evb,r))).size).toBe(2);
  const comma=evb.lines.find(r=>r.row===55)!;
  expect(comma.cells[3]).toBe(',');expect(comma.sourceQuantity).toBe(2);expect(comma.referenceTokens).toEqual([]);
  expect(evb.lines.find(r=>r.row===13)?.cells[1]).toBe('Closed');
  expect(evb.lines.find(r=>r.row===13)?.populationStatus).toBe('unreviewed');
  expect(evb.lines.find(r=>r.row===3)?.categoryHint).toBe('non_procurement_candidate');
 });
 it('실제 원문과 합성 구매 매핑을 분리하며 사진은 근거·실장/개정 검수로 승격되지 않음',()=>{
  const row=actualBoms['EVB-C'].lines.find(r=>r.row===21)!;
  expect(row.cells).toEqual(['2','10uF/6.3V/20%/X5R/C0603','C_0603_5MIL_DWS','C18,C26']);
  expect(entityById('IM-EVB-C-C18-C26')?.source).toBe('합성 예시');
  expect(entityById('IM-0008')?.name).toBe('MLCC 10uF / 25V');
  expect(relations.find(r=>r.id==='rel-map-evb-c-purchase')?.from).toBe('PART-EVB-C-21');
  for(const bom of actualBomList)for(const row of bom.lines){
   const media=resolveEntityMedia(entityById(actualPartId(bom,row))!);
   if(media){expect(media.evidenceEligible).toBe(false);expect(media.revisionMatch).not.toBe('verified');}
  }
 });
});
