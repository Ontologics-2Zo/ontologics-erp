import type {Entity} from './entity-data';
import rawBom from './bom-source.json';

export type MediaKind='actual-photo'|'cad-render'|'reference-photo'|'ai-reference';
export type MediaAsset={assetId:string;url:string;kind:MediaKind;source:string;sourceUrl?:string;subject:string;createdAt:string;evidenceEligible:false;rights:string};
export type EntityMedia=MediaAsset & {targetId:string;scope:string;match:string;revisionMatch:'unverified'|'not-applicable'|'verified'};
export const AI_MEDIA_NOTICE='외형 이해용 참고 이미지이며 실제 제품·배치와 다를 수 있습니다.';
export const MEDIA_KIND_LABELS:Record<MediaKind,string>={'actual-photo':'실제 사진','cad-render':'CAD 렌더','reference-photo':'참고 사진','ai-reference':'AI 생성'};
const ai=(assetId:string,subject:string):MediaAsset=>({assetId,url:`/media/${assetId}.png`,kind:'ai-reference',source:'OpenAI 내장 이미지 생성 도구 · 사전 생성 자산',subject,createdAt:'2026-11-05',evidenceEligible:false,rights:'이 목업용 생성 참고 자산'});
const official=(assetId:string,model:string):MediaAsset=>({assetId,url:`/media/${assetId}.jpg`,kind:'reference-photo',source:`OLIMEX 공식 제품 페이지 · ${model}`,sourceUrl:`https://www.olimex.com/Products/IoT/ESP32/${model}/`,subject:model,createdAt:'2026-11-05 (확보일)',evidenceEligible:false,rights:'제조사 공개 제품 사진 · 재배포 라이선스 미확인 · 로컬 참고용'});
export const mediaAssets:Record<string,MediaAsset>={
 'olimex-poe':official('olimex-poe','ESP32-POE'),
 'olimex-poeiso':official('olimex-poeiso','ESP32-POE-ISO'),
 'olimex-evb':official('olimex-evb','ESP32-EVB'),
 'olimex-gateway':official('olimex-gateway','ESP32-GATEWAY'),
 ...Object.fromEntries([
  ['board-io','디지털 I/O 보드 종류'],['board-sense','센서 인터페이스 보드 종류'],['board-power','전원 분배 보드 종류'],
  ['resistor','칩 저항 종류'],['mlcc','적층 세라믹 커패시터 종류'],['soic8','SOIC-8 계열 패키지'],['qfn','QFN 계열 패키지'],['sot23','SOT-23 3단자 패키지'],['diode','2단자 SMD 다이오드 종류'],['terminal','스크루 터미널 커넥터 종류'],
  ['array','칩 저항 어레이'],['ferrite','페라이트 비드'],['inductor','실드 전원 인덕터'],['electrolytic','전해 커패시터'],['sot5','SOT-23-5 패키지'],['ssop20','SSOP-20 계열 패키지'],['rfmodule','무선 모듈 종류'],['led','미점등 LED 종류 · 발광 색 검증 아님'],['esd','리드 없는 2단자 ESD 보호소자'],
  ['crystal','수정 진동자 패키지'],['tactile','택트 스위치 종류'],['micro-usb','Micro USB 소켓'],['rj45','RJ45 소켓'],['microsd','microSD 소켓'],['header','1×10 핀 헤더'],['pcb','미실장 기판 종류'],['battery-connector','2핀 상부 삽입 배터리 커넥터 종류'],['boxed-header','2×5 박스 헤더']
 ].map(([id,subject])=>[id,ai(id,subject)]))
};
export type MediaBinding={assetId:string;scope:string};
export const mediaBindings:Record<string,MediaBinding>={};
const bind=(ids:string[],assetId:string,scope:string)=>ids.forEach(id=>{mediaBindings[id]={assetId,scope}});
bind(['MODEL-POE','CFG-POE-L','CFG-POE-L1'],'olimex-poe','해당 모델의 제조사 참고 사진 · L/L1 개정 일치 미검수');
bind(['MODEL-POEISO'],'olimex-poeiso','해당 모델의 제조사 참고 사진 · N 개정 일치 미검수');
bind(['MODEL-EVB'],'olimex-evb','해당 모델의 제조사 참고 사진 · C 개정 일치 미검수');
bind(['MODEL-GATEWAY'],'olimex-gateway','해당 모델의 제조사 참고 사진 · I 개정 일치 미검수');
bind(['MODEL-IO','CFG-IO-A'],'board-io','합성 IO-24용 종류별 예시 · 정확한 회로·배치 재현 아님');
bind(['MODEL-SENSE','CFG-SENSE-A'],'board-sense','합성 SENSE-4용 종류별 예시 · 정확한 회로·배치 재현 아님');
bind(['MODEL-PWR','CFG-PWR-B'],'board-power','합성 PWR-12용 종류별 예시 · 정확한 회로·배치 재현 아님');
bind(['PART-TPS','PART-ALT','PART-CAND'],'soic8','확인된 SOIC-8 패키지의 종류별 참고 · 품번·핀배치·호환성 검증 아님');
bind(['LOT-L07'],'soic8','연결 품목 PART-TPS의 패키지 참고 · 이 로트의 실물·검사 사진 아님');
bind(['IM-0008'],'mlcc','MLCC 종류별 참고 · 정확한 크기·전압·용량 외형 검증 아님');
bind(['U101','U104','U106'],'olimex-poe','연결 모델의 제조사 참고 사진 · 이 개별 보드의 실물·장착 증거 아님');
bind(['TRACE-U201'],'board-io','연결 합성 IO 모델의 종류별 예시 · 이 개별 보드의 실물·장착 증거 아님');
for(const model of ['IO','SENSE','PWR']){
 for(const [part,asset] of [['MCU','qfn'],['ADC','qfn'],['REG','sot23'],['R','resistor'],['C','mlcc'],['CON','terminal'],['D','diode'],['PCB','pcb']]){
  if(part==='ADC'&&model!=='SENSE')continue;
  bind([`PART-${model}-${part}`],asset,'합성 품목의 일반 종류별 예시 · 패키지·핀 수·크기 미확정');
 }
}
// The original package field is read only for visual categorisation. It never changes BOM meaning or mounting status.
export function packageAsset(packageName:string):string|undefined{
 const p=packageName.toUpperCase().replace(/\s/g,'');
 if(/^R(0402|0603|1206|2512)$/.test(p))return 'resistor';
 if(/^C(0402|0603|0805|1206)$/.test(p)||p.startsWith('C_0805'))return 'mlcc';
 if(['SOIC-8','ESOIC-8'].includes(p))return 'soic8';
 if(p==='QFN32')return 'qfn';
 if(['SOT23','SOT-23','SOT23-3'].includes(p))return 'sot23';
 if(['SOD-123','SMA','DO214AB(SMC)'].includes(p))return 'diode';
 if(p==='RA1206')return 'array';
 if(p==='L0805')return 'ferrite';
 if(['CD32','DBS135'].includes(p))return 'inductor';
 if(p.startsWith('CPOL-'))return 'electrolytic';
 if(p==='SOT-23-5')return 'sot5';
 if(p==='SSOP-20W')return 'ssop20';
 if(p.startsWith('ESP32-WROVER'))return 'rfmodule';
 if(p==='LED_0603')return 'led';
 if(p.startsWith('TSX-'))return 'crystal';
 if(p==='IT1185AU2')return 'tactile';
 if(p==='MISB-SWMM-5B_LF')return 'micro-usb';
 if(p.startsWith('RJP-003TC1'))return 'rj45';
 if(p.startsWith('USD('))return 'microsd';
 if(p==='HN1X10')return 'header';
 if(p==='DW02S')return 'battery-connector';
 if(p==='GBH-254-SMT-10')return 'boxed-header';
 if(p==='D0402')return 'esd';
 return undefined;
}
for(const rev of ['L','L1'] as const)for(const row of rawBom[rev].filter(r=>r.row>2)){
 const asset=packageAsset(row.cells[2]);
 if(asset)bind([`PART-POE-${rev}-${row.row}`],asset,`원문 패키지 ${row.cells[2]} 기반 종류별 참고 · 크기·핀배치·실장 상태 검증 아님`);
}
export function resolveEntityMedia(entity:Entity):EntityMedia|undefined{
 // A future verified asset can replace this object mapping without altering business data.
 if(entity.photo)return entity.photo;
 const binding=mediaBindings[entity.id],asset=binding&&mediaAssets[binding.assetId];
 if(!asset)return undefined;
 return {...asset,targetId:entity.id,scope:binding.scope,match:binding.scope,revisionMatch:asset.kind==='ai-reference'?'not-applicable':'unverified'};
}
