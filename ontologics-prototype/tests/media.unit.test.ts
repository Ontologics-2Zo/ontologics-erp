import {describe,it,expect} from 'vitest';
import {existsSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {entities,type Entity} from '../src/entity-data';
import {mediaAssets,mediaBindings,resolveEntityMedia,packageAsset} from '../src/media-data';
import {createMockMediaPort,type PortContext} from '../src/ports';

const publicRoot=resolve(import.meta.dirname,'../public');
const context=(companyId='A'):PortContext=>({companyId,actor:'Alice',identityRevision:1,contextRevision:1,entityId:null,dataVersion:1});

describe('media catalog provenance and local delivery',()=>{
 it('등록된 모든 미디어 바인딩은 존재하는 객체와 로컬 이미지 파일로 연결',()=>{
   expect(Object.keys(mediaAssets).length).toBeGreaterThan(0);
   expect(Object.keys(mediaBindings).length).toBeGreaterThan(0);
   for(const [entityId,binding] of Object.entries(mediaBindings)){
     const entity=entities.find(item=>item.id===entityId);
     expect(entity,entityId+' object').toBeDefined();
     expect(mediaAssets[binding.assetId],entityId+' asset').toBeDefined();
     const media=resolveEntityMedia(entity!);
     expect(media,entityId+' resolved media').toBeDefined();
     expect(media!.assetId).toBe(binding.assetId);
     expect(media!.targetId).toBe(entityId);
     expect(media!.url).toMatch(/^\/media\//);
     const file=resolve(publicRoot,'.'+media!.url);
     expect(file.startsWith(publicRoot+'/')).toBe(true);
     expect(existsSync(file),media!.url).toBe(true);
     expect(statSync(file).size,media!.url).toBeGreaterThan(100);
     expect(media!.source.trim()).not.toBe('');
     expect(media!.scope.trim()).not.toBe('');
     expect(media!.match.trim()).not.toBe('');
   }
 });
 it('AI 참고 이미지는 원문·개정 검증·업무 근거로 승격되지 않음',()=>{
   const evidenceBefore=structuredClone(entities.map(e=>({id:e.id,source:e.source,evidence:e.evidence})));
   const resolved=entities.flatMap(entity=>{const media=resolveEntityMedia(entity);return media?[{entity,media}]:[];});
   expect(resolved.some(({media})=>media.kind==='ai-reference')).toBe(true);
   for(const {entity,media} of resolved){
     expect(['actual-photo','cad-render','reference-photo','ai-reference']).toContain(media.kind);
     expect(media.evidenceEligible).toBe(false);
     expect(entity.evidence).not.toContain(media.assetId);
     expect(entity.evidence).not.toContain(media.url);
     if(media.kind==='ai-reference'){
       expect(media.revisionMatch).not.toBe('verified');
       expect(media.source+' '+media.match).toMatch(/AI|생성/);
     }
   }
   expect(entities.map(e=>({id:e.id,source:e.source,evidence:e.evidence}))).toEqual(evidenceBefore);
 });
 it('같은 불변 객체는 재조회·정렬과 무관하게 같은 이미지로 해석',()=>{
   for(const entity of [...entities].reverse()){
     const first=resolveEntityMedia(entity),second=resolveEntityMedia(structuredClone(entity));
     expect(second).toEqual(first);
     if(first)expect(first.targetId).toBe(entity.id);
   }
   const unavailable:Entity={id:'UNREGISTERED-MEDIA',type:'계약',name:'미등록 계약',company:'A',revision:'1',status:'초안',source:'합성 예시',properties:{},evidence:[]};
   expect(resolveEntityMedia(unavailable)).toBeUndefined();
 });
 it('알 수 없는 패키지와 다른 단자 수를 임의 사진으로 대체하지 않음',()=>{for(const name of ['', 'SOT23-5', 'QFN-UNKNOWN', 'ESP32-WROOM module', 'unmapped'])expect(packageAsset(name)).toBeUndefined();});
 it('MediaPort는 회사 범위를 검증한 뒤에만 이미지 URL과 출처를 반환',async()=>{
   let current=context();
   const item=entities.find(e=>resolveEntityMedia(e))!;
   const port=createMockMediaPort(()=>entities,{id:e=>e.id,company:e=>e.company,searchText:e=>e.name},resolveEntityMedia,()=>current);
   expect(await port.get(item.id,current)).toEqual({state:'registered',media:resolveEntityMedia(item)});
   await expect(port.get(item.id,{...current,companyId:'B'})).rejects.toThrow('범위');
   current={...context('B'),identityRevision:2};
   await expect(port.get(item.id,current)).rejects.toThrow('권한');
 });
});
