import {useEffect,useRef,useState} from 'react';
import {ClipboardList,FileText,Save} from 'lucide-react';
import {useApp} from './context';
import {useEntity,EntityChip} from './entity';
import {entities} from './entity-data';
import {NOW,validTime} from './domain';
import {Badge,Button,Field,Notice,Panel} from './ui';
import './request-forms.css';

export type RecordRequestMode='inventory'|'trace'|'test';
type RecordOperation='issue'|'consume'|'return'|'scrap'|'move'|'lot_register'|'mount'|'remove'|'test_request'|'test_result'|'test_correction';
type InputKey='targetId'|'relatedId'|'configurationId'|'newId'|'quantity'|'unit'|'sourceEvent'|'originalEvent'|'occurredAt'|'evidence'|'reason'|'reviewerNotes'|'fromLocation'|'toLocation'|'position'|'coverage'|'executionId'|'criterion'|'conditions'|'result';
type Values=Record<InputKey,string>;
type FieldConfig={key:InputKey;label:string;required?:boolean;kind?:'entity'|'number'|'text'|'textarea'|'select';options?:string[];types?:string[];hint?:string};
type OperationConfig={id:RecordOperation;label:string;title:string;target:string;related:string;notice:string;fields:FieldConfig[]};
const sourceFields:FieldConfig[]=[
 {key:'sourceEvent',label:'이번 근거 사건 ID',required:true,hint:'새 기록의 식별자입니다. 이미 저장한 같은 사건은 다시 작성하지 않습니다.'},
 {key:'occurredAt',label:'발생 시각 · 시간대 포함',required:true,hint:'스냅샷 기준시각 이전의 ISO 8601 시각을 입력하세요.'},
 {key:'evidence',label:'원문 근거 ID · 제공 자료 경로',required:true,hint:'존재가 검증된 파일을 자동 연결하지 않습니다. 검토자가 원문을 대조해야 합니다.'},
 {key:'reason',label:'작성 이유 · 검토할 사실',kind:'textarea',required:true},
 {key:'reviewerNotes',label:'검토자 전달 사항 · 미확인 범위',kind:'textarea'}
];
const quantityFields:FieldConfig[]=[{key:'quantity',label:'이번 사건 수량',kind:'number',required:true},{key:'unit',label:'수량 단위',kind:'select',options:['EA','대','개'],required:true}];
const originalField:FieldConfig={key:'originalEvent',label:'원사건 ID · 정정/반납 대상',required:true,hint:'원사건 존재·잔량·타 작업 여부는 서버 검토 전 미검증입니다.'};
const locationFields:FieldConfig[]=[{key:'fromLocation',label:'출발 위치 · 근거 원문 표기',required:true},{key:'toLocation',label:'도착 위치 · 근거 원문 표기',required:true}];
const inventory=(id:RecordOperation,label:string,notice:string,extra:FieldConfig[]):OperationConfig=>({id,label,title:label+' 검토 문서 초안',target:'LOT-L07',related:'JOB-2609-01',notice,fields:[{key:'targetId',label:'부품 로트 ID',kind:'entity',types:['부품 로트'],required:true},{key:'relatedId',label:'생산작업 ID',kind:'entity',types:['생산작업'],required:true},...quantityFields,...extra,...sourceFields]});
const trace=(id:RecordOperation,label:string,notice:string,extra:FieldConfig[]):OperationConfig=>({id,label,title:label+' 검토 문서 초안',target:id==='lot_register'?'PART-TPS':'U104',related:id==='lot_register'?'':'LOT-L07',notice,fields:[{key:'targetId',label:id==='lot_register'?'사내 품목 ID':'개별 보드 ID',kind:'entity',types:id==='lot_register'?['사내 품목']:['개별 보드'],required:true},...(id==='lot_register'?[]:[{key:'relatedId' as const,label:'부품 로트 ID',kind:'entity' as const,types:['부품 로트'],required:true}]),{key:'configurationId',label:'대상 구성 ID',kind:'entity',types:['제품 구성'],required:true},...quantityFields,...extra,...sourceFields]});
const testFields:FieldConfig[]=[{key:'targetId',label:'클레임 ID',kind:'entity',types:['클레임'],required:true},{key:'relatedId',label:'시료 보드 ID',kind:'entity',types:['개별 보드'],required:true},...quantityFields,{key:'executionId',label:'시험 실행 ID · execution',required:true},{key:'criterion',label:'시험 기준 · 단위',required:true},{key:'conditions',label:'시험 조건 · 제공 범위',kind:'textarea',required:true}];
export const RECORD_REQUEST_CONFIG:Record<RecordRequestMode,{title:string;source:string;operations:OperationConfig[]}>= {
 inventory:{title:'재고 사건 검토 문서',source:'PNL-10 · SD-011',operations:[
  inventory('issue','불출','불출 요청과 실제 현장 불출은 다릅니다. 재고·예약·소비 수량을 변경하지 않습니다.',locationFields),
  inventory('consume','소비','실제 소비·타 작업 여부와 원불출 잔량을 원문으로 검토합니다. 설계 BOM으로 소비를 추정하지 않습니다.',[originalField,{key:'fromLocation',label:'사용 위치 · 근거 원문 표기',required:true}]),
  inventory('return','반납','반납은 원불출 사건과 연결해야 합니다. 이 문서만으로 재고를 증가시키지 않습니다.',[originalField,...locationFields]),
  inventory('scrap','폐기','이 문서는 폐기 사실 또는 요청의 검토 자료입니다. 실제 폐기·불량 격리 권한을 부여하지 않습니다.',[originalField,{key:'fromLocation',label:'대상 위치 · 근거 원문 표기',required:true}]),
  inventory('move','이동','출발·도착 위치를 구분합니다. 이동 기록은 장착 증거가 아니며 물리 수량을 변경하지 않습니다.',locationFields)
 ]},
 trace:{title:'로트·장착·제거 기록 검토 문서',source:'PNL-21 · SD-020',operations:[
  trace('lot_register','로트 등록','새 로트 식별자 후보를 검토 문서에 보관합니다. 원장과 객체 목록에는 아직 등록되지 않습니다.',[{key:'newId',label:'새 사내 로트 ID',required:true},{key:'fromLocation',label:'공급처·제조사 로트 · 원문 표기',required:true}]),
  trace('mount','장착 기록','설계 BOM이나 불출만으로 장착을 확정하지 않습니다. 장착 위치·시각·원문 사건을 따로 검토합니다.',[{key:'position',label:'실제 장착 위치 · RefDes',required:true},{key:'coverage',label:'기록의 확인 범위 · 미확인',kind:'textarea',required:true}]),
  trace('remove','제거 기록','제거 기록과 재장착 없음의 확인 범위는 다릅니다. 제거 미기록을 계속 장착으로 처리하지 않습니다.',[originalField,{key:'position',label:'제거 위치 · RefDes',required:true},{key:'coverage',label:'제거 후 확인 기간 · 재장착 여부·미확인',kind:'textarea',required:true}])
 ]},
 test:{title:'시험 의뢰·제공 결과 검토 문서',source:'PNL-24 · SD-023',operations:[
  {id:'test_request',label:'시험 의뢰',title:'시험 의뢰 문서 초안',target:'CLAIM-01',related:'U104',notice:'의뢰 문서 저장은 시험팀 송신·접수·실제 시험 실행이 아닙니다. 결과를 생성하지 않습니다.',fields:[...testFields,...sourceFields]},
  {id:'test_result',label:'제공 결과',title:'제공 시험 결과 검토 초안',target:'CLAIM-01',related:'U104',notice:'시험팀이 제공한 결과와 조건을 그대로 기록해 검토합니다. 신고 전체나 미검사 시료를 불량으로 확정하지 않습니다.',fields:[...testFields,{key:'originalEvent',label:'시험 의뢰 사건 ID',required:true},{key:'result',label:'제공된 판정 · 원문 기준',kind:'select',options:['미확인','합격','불합격','판정 불가'],required:true},...sourceFields]},
  {id:'test_correction',label:'결과 정정',title:'기존 시험 결과 정정 검토 초안',target:'CLAIM-01',related:'U104',notice:'정정은 원기록을 지우지 않습니다. 새 시험은 새 execution으로 별도 작성하고 정정과 구분합니다.',fields:[...testFields,originalField,{key:'result',label:'정정 요청 판정 · 원문 기준',kind:'select',options:['미확인','합격','불합격','판정 불가'],required:true},...sourceFields]}
 ]}
};
function initialValues(config:OperationConfig):Values{return {targetId:config.target,relatedId:config.related,configurationId:'CFG-POE-L1',newId:'',quantity:'1',unit:config.id.startsWith('test_')?'대':'EA',sourceEvent:'',originalEvent:'',occurredAt:NOW,evidence:'',reason:'',reviewerNotes:'',fromLocation:'',toLocation:'',position:'',coverage:'',executionId:'',criterion:'',conditions:'',result:'미확인'}};

export function ReviewRequestForm({mode,operation}:{mode:RecordRequestMode;operation:RecordOperation}){
 const app=useApp(),context=useEntity();const definition=RECORD_REQUEST_CONFIG[mode],config=definition.operations.find(x=>x.id===operation)??definition.operations[0];
 const [forms,F]=useState<Record<string,Values>>({}),[error,E]=useState(''),[result,R]=useState<Record<string,{status:'completed'|'unknown';requestId:string;signature:string}>>({});const requests=useRef<Record<string,{signature:string;key:string}>>({});
 const values=forms[operation]??initialValues(config),receipt=result[operation];const signature=JSON.stringify({mode,operation,values});const fields=config.fields;const writable=app.actor!=='Viewer'&&context.company==='A';
 useEffect(()=>E(''),[operation]);
 const update=(key:InputKey,value:string)=>{F(prev=>({...prev,[operation]:{...values,[key]:value}}));E('')};
 const save=()=>app.run(async()=>{E('');try{
  if(!writable)throw Error('현재 계정은 검토 문서 초안을 저장할 수 없습니다.');
  for(const field of fields){const value=values[field.key].trim();if(field.required&&!value)throw Error(field.label+'을(를) 입력하세요.');if(field.kind==='entity'&&value){const entity=context.resolve(value);if(!entity||entity.company!==context.company)throw Error('현재 회사 범위에서 확인할 수 없는 객체 ID입니다.');if(field.types&&!field.types.includes(entity.type))throw Error(field.label+'의 객체 유형을 확인하세요.');}}
  const quantity=Number(values.quantity);if(!Number.isSafeInteger(quantity)||quantity<=0)throw Error('수량은 0보다 큰 안전한 정수여야 합니다. 미확인 수량을 0으로 대신 입력하지 마세요.');
  if(!validTime(values.occurredAt)||Date.parse(values.occurredAt)>Date.parse(NOW))throw Error('유효한 시간대 포함 시각이 필요하며 스냅샷 기준시각보다 미래일 수 없습니다.');
  if(values.originalEvent.trim()===values.sourceEvent.trim())throw Error('이번 사건과 참조할 원사건은 서로 다른 ID여야 합니다.');
  if(operation==='lot_register'){if(!/^[A-Za-z0-9][A-Za-z0-9_.:-]{2,79}$/.test(values.newId))throw Error('새 로트 ID는 영문·숫자·점·밑줄·콜론·하이픈으로 3~80자 입력하세요.');if(context.resolve(values.newId))throw Error('현재 회사에 이미 등록된 식별자입니다.');}
  if(mode==='trace'&&operation!=='lot_register'&&quantity!==1)throw Error('개별 보드의 위치별 장착·제거 검토는 한 사건에 1개씩 작성하세요.');
  if(mode==='test'&&quantity!==1)throw Error('개별 시료 보드의 시험 문서는 시료별로 작성하세요.');
  const duplicates=app.s.docs.flatMap(d=>{try{const parsed=JSON.parse(d.body);return parsed.type==='review-request'&&parsed.companyId===context.company?[parsed]:[]}catch{return []}});
  if(duplicates.some(d=>d.operation===operation&&d.fields.sourceEvent===values.sourceEvent.trim()))throw Error('같은 회사·유형·근거 사건의 검토 문서가 이미 있습니다. 새 사실을 중복 저장하지 말고 기존 문서를 확인하세요.');
  if(operation==='lot_register'&&duplicates.some(d=>d.operation==='lot_register'&&d.fields.newId===values.newId.trim()))throw Error('이 새 로트 ID의 검토 문서가 이미 있습니다. 원장 등록 전 중복 초안을 만들지 않습니다.');
  const fixed=Object.fromEntries(fields.map(field=>[field.key,values[field.key].trim()]));
  const previous=requests.current[operation];const command=previous?.signature===signature?previous:{signature,key:crypto.randomUUID()};requests.current[operation]=command;
  const record={type:'review-request',schemaVersion:1,mode,operation,label:config.label,companyId:context.company,origin:'local-synthetic-review',status:'검토 문서 초안 · 사실/현장 실행 미반영',factApplied:false,externalExecuted:false,fields:{...fixed,quantity},reviewContext:{author:app.actor,companyId:context.company,dataVersion:app.s.version,configurationId:fields.some(field=>field.key==='configurationId')?values.configurationId:(context.portContext.configurationId??null),selectedEntityId:context.selectedId||null,conditions:app.conditions,sourceRequirement:definition.source,verification:'입력 형식·객체 회사 범위만 검사. 원문·원사건·잔량·시험 범위의 서버 검증 미연결.'}};
  const outcome=await app.action({operation:'document.save',document:{name:config.label+' 검토 문서 · '+values.sourceEvent.trim(),body:JSON.stringify(record,null,2),status:record.status}},command.key);
  if(outcome.status==='completed'){R(prev=>({...prev,[operation]:{status:'completed',requestId:outcome.requestId,signature}}));app.toast(config.label+' 검토 문서 초안 저장 · 사실·현장 실행 미반영');}
  else if(outcome.status==='unknown')R(prev=>({...prev,[operation]:{status:'unknown',requestId:outcome.requestId,signature}}));
 }catch(err){E(err instanceof Error?err.message:String(err));}});
 const refs=fields.filter(f=>f.kind==='entity').map(f=>values[f.key]).filter(id=>context.resolve(id));
 return <div className="record-request-form"><div className="record-request-context"><ClipboardList size={16}/><strong>{config.title}</strong><Badge>회사 {context.company} · v{app.s.version}</Badge><span>{definition.source}</span></div><Notice>{config.notice}</Notice><div className="record-request-targets">{refs.map((id,index)=><EntityChip id={id} key={id+'-'+index}/>)}</div><div className="record-request-fields">{fields.map(field=><Field key={field.key} label={field.label+(field.required?' *':'')} hint={field.hint}>{field.kind==='textarea'?<textarea rows={3} value={values[field.key]} readOnly={!writable||receipt?.status==='unknown'} onChange={e=>update(field.key,e.target.value)}/>:field.kind==='select'?<select value={values[field.key]} disabled={!writable||receipt?.status==='unknown'} onChange={e=>update(field.key,e.target.value)}>{field.options!.map(v=><option key={v}>{v}</option>)}</select>:<><input type={field.kind==='number'?'number':'text'} min={field.kind==='number'?1:undefined} step={field.kind==='number'?1:undefined} value={values[field.key]} readOnly={!writable||receipt?.status==='unknown'} list={field.kind==='entity'?'record-options-'+mode+'-'+field.key:undefined} onChange={e=>update(field.key,e.target.value)} autoComplete="off"/>{field.kind==='entity'&&<datalist id={'record-options-'+mode+'-'+field.key}>{entities.filter(e=>e.company===context.company&&context.resolve(e.id)&&(!field.types||field.types.includes(e.type))).map(e=><option key={e.id} value={e.id}>{e.name} · {e.type}</option>)}</datalist>}</>}</Field>)}</div>{error&&<div className="record-request-error" role="alert">{error}<small>입력을 유지했습니다. 해당 항목을 보완해 다시 저장하세요.</small></div>}{receipt?.status==='completed'&&<Notice tone="success">검토 문서 초안을 저장했습니다. 원장·재고·장착·시험 판정은 반영하지 않았습니다. <code>{receipt.requestId}</code></Notice>}{receipt?.status==='unknown'&&<Notice tone="warning">접수 결과 미확인 · 입력을 유지하고 추가 쓰기를 차단했습니다. 상단의 ‘기존 요청 상태 확인’으로 같은 요청을 대사하세요. <code>{receipt.requestId}</code></Notice>}<div className="record-request-boundary"><strong>검토 전 미확인</strong><span>원사건 존재 · 원문 진위 · 실제 잔량 · 위치 식별 · 시험 의뢰 범위</span><small>이 문서는 승인 요청의 입력 자료입니다. 별도 승인 권한이나 새로운 승인 정책을 만들지 않으며, 해당 사실 등록 도구가 연결되기 전에는 확정·현장 실행하지 않습니다.</small></div><div className="record-request-actions"><span>스냅샷 기준 {NOW}</span><Button onClick={()=>app.go('UI06')}><FileText size={14}/>문서·근거 확인</Button><Button primary disabled={app.busy||!writable||receipt?.status==='unknown'||(receipt?.status==='completed'&&receipt.signature===signature)} onClick={save}><Save size={14}/>{receipt?.status==='completed'&&receipt.signature===signature?'이 내용 저장됨':'검토 문서 초안 저장'}</Button></div>{!writable&&<small className="muted">조회 계정은 입력·저장할 수 없습니다. 서버 권한은 미연결이며 현재는 UI 시뮬레이션입니다.</small>}</div>;
}

export function RecordRequests({mode}:{mode:RecordRequestMode}){const definition=RECORD_REQUEST_CONFIG[mode];const [operation,O]=useState<RecordOperation>(definition.operations[0].id);return <Panel title={definition.title} subtitle="구조화된 검토 입력 · 사실 등록과 현장 실행은 아직 반영하지 않습니다."><div className="record-request-tabs" role="tablist" aria-label={definition.title}>{definition.operations.map(op=><button type="button" role="tab" aria-selected={op.id===operation} key={op.id} onClick={()=>O(op.id)}>{op.label}</button>)}</div><ReviewRequestForm mode={mode} operation={operation}/></Panel>}
