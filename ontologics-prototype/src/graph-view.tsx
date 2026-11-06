import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowLeft,ArrowRight,Box,CheckCircle2,Clock,ExternalLink,ImageOff,Layers,Network,RefreshCw,Search,ShieldCheck,X} from 'lucide-react';
import type {Entity,Relation} from './entity-data';
import {AI_MEDIA_NOTICE,MEDIA_KIND_LABELS,resolveEntityMedia} from './media-data';
import {impactNextStep} from './change-impact-model';
import {sameGraphStatus} from './graph-projection';
import './graph-view.css';

type GraphStatus={mode:'local-mock-projection';sessionId:string;companyId:string;sourceId:string;state:'empty'|'queued'|'ready'|'failed';ledgerVersion:number|null;graphVersion:number|null;receivedSequence:number|null;projectedSequence:number|null;receivedAt:string|null;projectedAt:string|null;error:string|null;simulationDelayMs:number};
type Metrics={required:number;reserved:number;unreservedOriginal:number;receiptPass:number|null;materialAllocated:number;unsecured:number;bomApplied:boolean;demandConfirmed:boolean;unallocatedPass:number|null};
type Snapshot={schema:1;companyId:'A';sourceId:string;sequence:number;ledgerVersion:number;asOf:string;publishedAt:string;selectedId:string|null;entities:Entity[];relations:Relation[];metrics:Metrics;reviews:{id:string;version:number;hash:string;status:string;author:string;approvedBy?:string;base:number}[]};
type Envelope={status:GraphStatus;snapshot:Snapshot|null};
const relationNames:Record<Relation['type'],string>={design:'설계 BOM',mount:'장착 사건',flow:'업무 연결',substitution:'대체 승인',reservation:'예약'};
const initialParameters=new URLSearchParams(location.hash.slice(1));
const initialObject=initialParameters.get('object')??'';
function readToken(){const incoming=initialParameters.get('token');try{if(incoming)sessionStorage.setItem('ontologics-graph-reader',incoming);return incoming??sessionStorage.getItem('ontologics-graph-reader')??''}catch{return incoming??''}finally{if(location.hash)history.replaceState(null,'',location.pathname)}}
const authToken=readToken();
const allowedSourceOrigins=['http://127.0.0.1:5175','http://localhost:5175','http://127.0.0.1:5177','http://localhost:5177'];
const sourceOrigin=(()=>{try{const incoming=initialParameters.get('sourceOrigin');if(incoming&&allowedSourceOrigins.includes(incoming)){sessionStorage.setItem('ontologics-graph-source-origin',incoming);return incoming}const saved=sessionStorage.getItem('ontologics-graph-source-origin');return saved&&allowedSourceOrigins.includes(saved)?saved:''}catch{return ''}})();
const expectedSession=(()=>{try{const incoming=initialParameters.get('sessionId');if(incoming){sessionStorage.setItem('ontologics-graph-session',incoming);return incoming}return sessionStorage.getItem('ontologics-graph-session')??''}catch{return initialParameters.get('sessionId')??''}})();
const displayTime=(value:string|null|undefined)=>value?new Date(value).toLocaleString('ko-KR',{hour12:false}):'미확인';
const version=(value:number|null|undefined)=>value==null?'미확인':`v${value}`;

function Photo({entity}:{entity:Entity}){
 const media=resolveEntityMedia(entity),[failed,F]=useState(false),[loaded,L]=useState(false),[open,O]=useState(false),[zoom,Z]=useState(false);
 useEffect(()=>{F(false);L(false);O(false);Z(false)},[entity.id,media?.url]);
 const image=(full=false)=>!media?<span className="gv-photo-empty"><ImageOff size={22}/>실물 사진 미등록</span>:failed?<span className="gv-photo-empty" role="status"><ImageOff size={22}/>이미지 불러오기 실패</span>:<><img src={media.url} alt={`${entity.name} · ${MEDIA_KIND_LABELS[media.kind]} · ${media.scope}`} onLoad={()=>L(true)} onError={()=>F(true)} style={full&&zoom?{width:'160%',maxWidth:'none'}:undefined}/>{!loaded&&<span className="gv-photo-loading">이미지 불러오는 중</span>}</>;
 return <Dialog.Root open={open} onOpenChange={O}><Dialog.Trigger asChild><button className="gv-photo" aria-label={`${entity.name} 이미지 확대 및 출처`} data-entity-id={entity.id} data-asset-id={media?.assetId??''}>{image()}{media&&<span className={'gv-media-badge '+(media.kind==='ai-reference'?'ai':'')}>{MEDIA_KIND_LABELS[media.kind]}</span>}<small>사진 확대 · 출처</small></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="gv-overlay"/><Dialog.Content className="gv-photo-dialog"><div className="gv-dialog-top"><div><Dialog.Title>사진·출처</Dialog.Title><Dialog.Description>{entity.name} · {entity.id} · 선택 객체 유지</Dialog.Description></div><Dialog.Close aria-label="사진 닫기"><X size={18}/></Dialog.Close></div>{media?.kind==='ai-reference'&&<p className="gv-notice">{AI_MEDIA_NOTICE}</p>}<div className="gv-photo-full">{image(true)}</div>{media&&<><button onClick={()=>Z(!zoom)}>{zoom?'화면에 맞추기':'이미지 확대'}</button><dl className="gv-properties"><dt>분류</dt><dd>{MEDIA_KIND_LABELS[media.kind]} · {media.revisionMatch==='verified'?'개정 일치 확인':media.revisionMatch==='unverified'?'개정 일치 미검수':'특정 제품 재현 아님'}</dd><dt>대상 범위</dt><dd>{media.scope}</dd><dt>출처</dt><dd>{media.source} {media.sourceUrl&&<a href={media.sourceUrl} target="_blank" rel="noreferrer">출처 확인 <ExternalLink size={12}/></a>}</dd><dt>자산</dt><dd>{media.assetId} · {media.createdAt}</dd></dl><p className="gv-muted">외형 참고 전용 · 검사 사진·장착 증거·호환성 판단 근거로 사용하지 않습니다.</p></>}<Dialog.Close className="gv-primary">선택 객체로 복귀</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
function MiniGraph({root,edges,entities,onSelect}:{root:Entity;edges:Relation[];entities:Entity[];onSelect:(id:string)=>void}){
 const map=new Map(entities.map(e=>[e.id,e]));
 const neighborIds=[...new Set(edges.flatMap(e=>[e.from,e.to]))].filter(id=>id!==root.id).slice(0,10);
 const visible=new Set([root.id,...neighborIds]);
 const shownEdges=edges.filter(e=>visible.has(e.from)&&visible.has(e.to)).slice(0,800);
 const positions=new Map([[root.id,{x:20,y:218}],...neighborIds.map((id,i)=>[id,{x:i<5?355:670,y:25+(i%5)*95}] as [string,{x:number;y:number}])]);
 return <><div className="gv-canvas"><svg viewBox="0 0 930 530" role="group" aria-label="선택 객체의 방향 있는 관계 그래프"><defs><pattern id="gv-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" opacity=".12"/></pattern><marker id="gv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#7990b2"/></marker></defs><rect width="930" height="530" fill="url(#gv-dots)"/>{shownEdges.map(edge=>{const from=positions.get(edge.from)!,to=positions.get(edge.to)!,right=to.x>from.x;return <path key={edge.id} d={`M${from.x+(right?230:0)},${from.y+33} C${(from.x+to.x)/2+115},${from.y+33} ${(from.x+to.x)/2+115},${to.y+33} ${to.x+(right?0:230)},${to.y+33}`} fill="none" stroke="#9aacC5" strokeWidth="1.4" markerEnd="url(#gv-arrow)"><title>{edge.from} → {edge.label} → {edge.to} · {edge.scope} · {edge.evidence}</title></path>})}{[root.id,...neighborIds].map(id=>{const entity=map.get(id)!,point=positions.get(id)!;return <g key={id} role="button" tabIndex={0} aria-label={`${entity.name} 그래프 객체 선택`} className={'gv-node '+(id===root.id?'selected':'')} transform={`translate(${point.x},${point.y})`} onClick={()=>onSelect(id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(id)}}}><rect width="230" height="68" rx="7"/><text x="12" y="17" className="gv-node-type">{entity.type} · {entity.source==='합성 예시'?'합성':'원본 범위 확인'}</text><text x="12" y="36" className="gv-node-name">{entity.name.length>23?entity.name.slice(0,22)+'…':entity.name}</text><text x="12" y="54" className="gv-node-id">{id}</text><title>{entity.name} · {entity.status}</title></g>})}</svg></div><div className="gv-graph-foot"><span>표시 {visible.size}개 객체 / {shownEdges.length}개 관계</span><span>선택 객체 연결 {edges.length}개 · 전체는 아래 관계 목록</span></div></>;
}
function Metric({label,value,previous,unit='EA',nullLabel='미확인'}:{label:string;value:number|null;previous?:number|null;unit?:string;nullLabel?:string}){
 const difference=value!=null&&previous!=null?value-previous:0;
 return <div><span>{label}</span><strong>{value==null?nullLabel:value.toLocaleString()}<small>{value==null?'':unit}</small></strong><em>{difference!==0?`직전 투영 대비 ${difference>0?'+':''}${difference} ${unit}`:'별도 수량 기준'}</em></div>;
}
type OwnerContext={ledgerVersion:number;sequence:number;entityId:string};
function GraphView(){
 const [envelope,Envelope]=useState<Envelope|null>(null),[previous,Previous]=useState<Snapshot|null>(null),[error,SetError]=useState('');
 const [blocked,Blocked]=useState(!authToken||!expectedSession||!sourceOrigin||!window.opener),[ownerConfirmed,OwnerConfirmed]=useState(false),[expected,Expected]=useState<OwnerContext|null>(null);
 const [selectedId,Select]=useState(initialObject),[follow,Follow]=useState(true),[query,Query]=useState(''),[page,Page]=useState(0),[relationPage,RelationPage]=useState(0),[reviewPage,ReviewPage]=useState(0),[relationType,RelationType]=useState('all'),[theme,Theme]=useState(()=>{try{return localStorage.getItem('ontologics-graph-theme')==='dark'?'dark':'light'}catch{return 'light'}});
 const last=useRef<Snapshot|null>(null),selection=useRef(selectedId),following=useRef(follow),revoked=useRef(false),owner=useRef(false),currentEnvelope=useRef(envelope),pendingContext=useRef<OwnerContext|null>(null);
 selection.current=selectedId;following.current=follow;currentEnvelope.current=envelope;
 const clearSession=(message='연결 권한이 만료되었거나 업무 계정이 전환되었습니다. 업무 화면에서 다시 연결하세요.')=>{
  revoked.current=true;owner.current=false;OwnerConfirmed(false);Envelope(null);Previous(null);Expected(null);last.current=null;pendingContext.current=null;Select('');Blocked(true);SetError(message);
  try{for(const key of ['ontologics-graph-reader','ontologics-graph-source-origin','ontologics-graph-session'])sessionStorage.removeItem(key)}catch{}
 };
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(!expectedSession||!window.opener||event.source!==window.opener||event.origin!==sourceOrigin||event.data?.sessionId!==expectedSession)return;
   // Revocation must work before the first server response or owner acknowledgement.
   if(event.data.type==='ontologics.graph.revoke'){clearSession();return;}
   if(revoked.current||!['ontologics.graph.owner','ontologics.graph.context'].includes(event.data.type)||event.data.companyId!=='A'||!Number.isSafeInteger(event.data.ledgerVersion)||event.data.ledgerVersion<1||!Number.isSafeInteger(event.data.sequence)||event.data.sequence<0||typeof event.data.entityId!=='string')return;
   if(event.data.type==='ontologics.graph.owner'){owner.current=true;OwnerConfirmed(true);Blocked(false);}
   if(!owner.current)return;
   const next:OwnerContext={ledgerVersion:event.data.ledgerVersion,sequence:event.data.sequence,entityId:event.data.entityId},previousContext=pendingContext.current;
   // Delayed owner/context messages cannot make the known business version go backwards.
   if(previousContext&&(next.ledgerVersion<previousContext.ledgerVersion||next.sequence<previousContext.sequence))return;
   pendingContext.current=next;Expected(next);
   const snapshot=currentEnvelope.current?.snapshot;
   if(snapshot&&next.ledgerVersion===snapshot.ledgerVersion&&next.sequence<=snapshot.sequence&&following.current&&snapshot.entities.some(entity=>entity.id===next.entityId)){Select(next.entityId);RelationPage(0);}
  };
  addEventListener('message',receive);
  const ready=()=>{
   if(revoked.current||owner.current||!authToken||!expectedSession||!sourceOrigin||!window.opener)return;
   if(window.opener.closed){clearSession('업무 창이 닫혔습니다. 업무 화면에서 다시 연결하세요.');return;}
   window.opener.postMessage({type:'ontologics.graph.ready',sessionId:expectedSession},sourceOrigin);
  };
  ready();const timer=setInterval(ready,700);
  return()=>{clearInterval(timer);removeEventListener('message',receive)};
 },[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('ontologics-graph-theme',theme)}catch{}},[theme]);
 useEffect(()=>{
  if(!ownerConfirmed||!authToken||!expectedSession||!sourceOrigin||!window.opener)return;
  let live=true,timer:ReturnType<typeof setTimeout>|undefined,currentRequest:AbortController|undefined;
  const poll=async()=>{
   if(revoked.current||!owner.current)return;
   if(!window.opener||window.opener.closed){clearSession('업무 창이 닫혔습니다. 업무 화면에서 다시 연결하세요.');return;}
   const controller=new AbortController();currentRequest=controller;let timedOut=false;
   const timeout=setTimeout(()=>{timedOut=true;controller.abort()},5000);
   try{
    const read=async(path:string)=>{
     const response=await fetch('/local-graph/'+path,{headers:{Authorization:`Bearer ${authToken}`},cache:'no-store',signal:controller.signal});
     if(!response.ok){
      if([401,403,404,410].includes(response.status)){if(live)clearSession();return null;}
      throw new Error('그래프 서버 조회 실패 · 이전 투영을 최신으로 처리하지 않습니다.');
     }
     return response.json();
    };
    const status=await read('status') as GraphStatus|null;
    if(!status||!live||revoked.current||!owner.current)return;
    if(status.sessionId!==expectedSession||status.companyId!=='A'){clearSession('연결 세션·회사 범위를 확인하지 못했습니다. 데이터를 표시하지 않습니다.');return;}
    // Poll the small status record. Fetch objects only when a completed projection changes.
    const changed=status.projectedSequence!==null&&status.projectedSequence!==last.current?.sequence;
    const value=changed?await read('snapshot') as Envelope|null:{status,snapshot:last.current};
    if(!value)return;
    if(!live||revoked.current||!owner.current)return;
    if(!value.status||value.status.sessionId!==expectedSession||value.status.companyId!=='A'||(value.snapshot&&(value.snapshot.companyId!=='A'||value.snapshot.sourceId!==value.status.sourceId))){clearSession('연결 세션·회사 범위를 확인하지 못했습니다. 데이터를 표시하지 않습니다.');return;}
    SetError('');Blocked(false);Envelope(current=>sameGraphStatus(current?.status,value.status)&&current?.snapshot===value.snapshot?current:value);
    if(value.snapshot&&value.snapshot.sequence!==last.current?.sequence){
     Previous(last.current);last.current=value.snapshot;
     const pending=pendingContext.current;
     const proposed=following.current&&pending?.ledgerVersion===value.snapshot.ledgerVersion&&pending.sequence<=value.snapshot.sequence?pending.entityId:selection.current||value.snapshot.selectedId;
     Select(value.snapshot.entities.some(entity=>entity.id===proposed)?proposed!:(value.snapshot.entities[0]?.id??''));
    }
   }catch(err){
    if(live&&!revoked.current&&owner.current)SetError(timedOut?'그래프 서버 조회 시간 초과 · 이전 투영을 최신으로 처리하지 않습니다.':err instanceof Error?err.message:'그래프 서버 연결을 확인하세요.');
   }finally{clearTimeout(timeout);currentRequest=undefined;if(live&&!revoked.current&&owner.current)timer=setTimeout(poll,700);}
  };
  void poll();return()=>{live=false;currentRequest?.abort();clearTimeout(timer)};
 },[ownerConfirmed]);
 const snapshot=envelope?.snapshot,status=envelope?.status,selected=snapshot?.entities.find(entity=>entity.id===selectedId);
 const expectedPending=!!expected&&((status?.graphVersion??0)<expected.ledgerVersion||(status?.projectedSequence??0)<expected.sequence);
 const stale=!ownerConfirmed||!!error||status?.state!=='ready'||status?.projectedSequence!==status?.receivedSequence||expectedPending;
 const visibleEntities=useMemo(()=>snapshot?.entities.filter(e=>`${e.name} ${e.id} ${e.type}`.toLowerCase().includes(query.toLowerCase()))??[],[snapshot,query]);
 const related=useMemo(()=>snapshot?.relations.filter(e=>(e.from===selectedId||e.to===selectedId)&&(relationType==='all'||e.type===relationType))??[],[snapshot,selectedId,relationType]);
 const choose=(id:string)=>{Select(id);RelationPage(0);if(window.opener&&sourceOrigin&&snapshot&&status)window.opener.postMessage({type:'ontologics.graph.select',sessionId:status.sessionId,companyId:snapshot.companyId,ledgerVersion:snapshot.ledgerVersion,entityId:id},sourceOrigin)};
 const registrations=snapshot?.entities.filter(entity=>entity.type==='BOM 등록 반영')??[],registeredConfigurations=snapshot?.entities.filter(entity=>entity.type==='제품 구성'&&entity.properties['로컬 등록 상태'])??[];
 const addedObjects=previous&&snapshot?snapshot.entities.filter(entity=>!previous.entities.some(old=>old.id===entity.id)):[],addedRelations=previous&&snapshot?snapshot.relations.filter(edge=>!previous.relations.some(old=>old.id===edge.id)):[];
 const rows=visibleEntities.slice(page*12,page*12+12),relationRows=related.slice(relationPage*8,relationPage*8+8);
 useEffect(()=>{Page(0)},[query]);useEffect(()=>{RelationPage(0)},[selectedId,relationType]);
 const businessLink=(sourceOrigin||'http://127.0.0.1:5175')+'/#EXPLORE';
 return <div className="gv-app"><header className="gv-header"><a className="gv-brand" href={businessLink}><Network size={23}/><strong>ontologics</strong><span>GRAPH OBSERVER</span></a><div><span className="gv-local">로컬 개발 · 읽기 전용</span><button onClick={()=>Theme(theme==='light'?'dark':'light')}>{theme==='light'?'다크':'라이트'}</button><a href={businessLink} target="_blank" rel="noreferrer">업무 화면 <ExternalLink size={14}/></a></div></header><main><div className="gv-heading"><div><span className="gv-eyebrow">SEPARATE GRAPH SERVER / :5176</span><h1>업무 반영과 그래프 갱신을 나누어 확인</h1><p>같은 객체 ID · 회사 범위 · 데이터 버전으로 전달된 로컬 읽기 모델입니다.</p></div><span className={'gv-status '+(stale?'pending':'ready')}>{!status?'연결 대기':error?'연결 확인 필요':!stale&&status.state==='ready'?'그래프 갱신 완료':status.state==='queued'||status.state==='ready'?'그래프 갱신 대기':status.state==='failed'?'그래프 갱신 실패':'최초 수신 대기'}</span></div>
 <div className="gv-notice"><ShieldCheck size={17}/><span>브라우저 Mock 업무 기록을 별도 로컬 서버에 투영합니다. 운영 DB·서버 권한·RDF/OWL 엔진·다중 사용자 동시 편집은 미연결입니다. 표시 지연 {status?.simulationDelayMs??400}ms는 개발 확인용입니다.</span></div>
 {error&&<div className="gv-error" role="alert">{error}</div>}
 {!authToken||blocked||!ownerConfirmed?<section className="gv-empty"><Network size={40}/><h2>{!blocked&&authToken&&!ownerConfirmed?'업무 창의 연결 권한을 확인하는 중':'업무 화면에서 그래프 서버 연결을 누르세요'}</h2><p>회사 범위가 있는 연결 세션을 받은 뒤에만 객체와 집계를 표시합니다.</p><a className="gv-primary" href={businessLink}>업무 화면으로 이동 <ArrowRight size={15}/></a></section>:<>
 <div className="gv-stage-grid" aria-label="업무 반영과 그래프 갱신 상태"><section><div><CheckCircle2 size={17}/><span>1 · 업무 반영 기록 수신</span></div><strong data-testid="graph-ledger-version">{version(status?.ledgerVersion)}</strong><p>회사 {status?.companyId??'미확인'} · 수신 순서 {status?.receivedSequence??'—'}</p><small>{displayTime(status?.receivedAt)} · 로컬 Mock 기준</small><p className="gv-owner-basis" data-testid="graph-owner-version">업무 창 {version(expected?.ledgerVersion)} · 게시 예정 순서 {expected?.sequence??'—'}</p></section><section className={stale?'waiting':'complete'}><div>{stale?<Clock size={17}/>:<Network size={17}/>}<span>2 · 그래프 갱신 완료</span></div><strong data-testid="graph-projected-version">{version(status?.graphVersion)}</strong><p>투영 순서 {status?.projectedSequence??'—'} · {stale?'이전 결과 또는 갱신 대기':'현재 수신분 반영 완료'}</p><small>{displayTime(status?.projectedAt)}</small></section><section><div><Layers size={17}/><span>3 · PoE L1 합성 계획</span></div><strong>{snapshot?`미확보 ${snapshot.metrics.unsecured} EA`:'아직 계산 없음'}</strong><p>{snapshot?'예약·합격분 할당 기준':'최초 투영을 기다립니다.'}</p><small>규칙 기반 안내 · 자동 실행·LLM 호출 없음</small></section></div>
 {stale&&snapshot&&<div className="gv-pending" role="status">업무 창 {version(expected?.ledgerVersion)} / 게시 순서 {expected?.sequence??'미확인'} → 현재 그래프 {version(snapshot.ledgerVersion)} / 투영 순서 {snapshot.sequence}. 새 업무 수신과 그래프 갱신 완료를 동일하게 표시하지 않습니다.</div>}
 {!snapshot?<section className="gv-empty"><RefreshCw size={25}/><h2>첫 그래프 갱신을 기다리는 중</h2><p>업무 화면에서 연결 상태와 게시 결과를 확인하세요.</p></section>:<>
 <section className="gv-panel" aria-label="BOM 등록 ABox 반영 관찰"><div className="gv-panel-head"><div><h2>BOM 등록 · ABox 반영 기록</h2><span>현재 정확 원본 연결 기록 {registrations.length}개 · 승인만으로 객체/관계가 생성되지 않음</span></div><span>{previous?`직전 투영 대비 객체 +${addedObjects.length} · 관계 +${addedRelations.length}`:'비교할 이전 투영 없음'}</span></div><div className="gv-table-scroll"><table><thead><tr><th>구성 / 원본 개정</th><th>등록 상태</th><th>승인 초안</th><th>반영 버전 / 기록</th></tr></thead><tbody>{registeredConfigurations.map(entity=><tr key={entity.id}><td><button className="gv-link" onClick={()=>choose(entity.id)}>{entity.name}</button><small>{entity.id}</small></td><td>{entity.properties['로컬 등록 상태']}</td><td>{entity.properties['승인 초안']??'정확 승인 근거 연결 전'}</td><td>{entity.properties['반영 데이터 버전']??'미반영'}{entity.properties['등록 반영 객체']&&<small><button className="gv-link" onClick={()=>choose(entity.properties['등록 반영 객체'])}>반영 객체·관계 확인</button></small>}</td></tr>)}</tbody></table></div><p className="gv-graph-note">원문 모델·구성·BOM 행은 기존 조회 자료입니다. 구성별 반영은 등록 기록·원본 문서 객체 2개와 근거 관계 3개를 연결하며, 실장·단위·정확 품번의 미확인과 업무 수량을 그대로 보존합니다. 아래 수량 지표는 PoE L1의 별도 합성 계획입니다.</p></section>
 <div className="gv-metrics"><Metric label="계획 필요" value={snapshot.metrics.required} previous={previous?.metrics.required}/><Metric label="이번 계획 원품 예약" value={snapshot.metrics.reserved} previous={previous?.metrics.reserved}/><Metric label="입고 합격 누계" nullLabel="미등록" value={snapshot.metrics.receiptPass} previous={previous?.metrics.receiptPass}/><Metric label="합격분 계획 할당" value={snapshot.metrics.materialAllocated} previous={previous?.metrics.materialAllocated}/><Metric label="계획 미확보" value={snapshot.metrics.unsecured} previous={previous?.metrics.unsecured}/><div><span>PoE L1 등록 상태</span><strong className="gv-word-value">{snapshot.metrics.bomApplied?'반영 완료':'미반영'}</strong><em>승인 상태와 별도</em></div></div>
 <div className="gv-next"><strong>현재 투영 기준 다음 확인</strong><span>{impactNextStep(snapshot.metrics,snapshot.metrics.demandConfirmed)}</span></div>
 <div className="gv-workspace"><section className="gv-panel"><div className="gv-panel-head"><div><h2>객체 관계 탐색</h2><span>{selectedId||'객체 선택 없음'} · 회사 {snapshot.companyId}</span></div><label><input type="checkbox" checked={follow} onChange={e=>{Follow(e.target.checked);if(e.target.checked){const context=pendingContext.current;const target=context?.ledgerVersion===snapshot.ledgerVersion&&context.sequence<=snapshot.sequence?context.entityId:snapshot.selectedId;if(target&&snapshot.entities.some(entity=>entity.id===target))Select(target)}}}/>업무 선택 따라가기</label></div><div className="gv-tools"><label>관계 유형 <select aria-label="그래프 관계 유형" value={relationType} onChange={e=>RelationType(e.target.value)}><option value="all">전체 유형 · 의미 구분</option>{Object.entries(relationNames).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label><span>설계 BOM ≠ 실제 장착 ≠ 예약</span></div>{selected?<MiniGraph root={selected} edges={related} entities={snapshot.entities} onSelect={choose}/>:<p className="gv-empty">현재 범위에 선택 객체가 없습니다.</p>}<p className="gv-graph-note">관계가 없다는 사실은 미장착·미사용을 뜻하지 않습니다. 표시 제한과 전체 조사 완료를 구분합니다.</p></section>
 <aside className="gv-panel gv-inspector" aria-label="그래프 객체 상세"><div className="gv-panel-head"><div><h2>선택 객체</h2><span>그래프·목록에서 같은 ID 유지</span></div><Box size={18}/></div>{selected?<><div className="gv-object-title"><span>{selected.type} · {selected.source}</span><h3>{selected.name}</h3><code>{selected.id}</code><p>{selected.status} · 개정 {selected.revision}</p></div><Photo key={selected.id} entity={selected}/><dl className="gv-properties"><dt>회사 / 데이터 버전</dt><dd>{selected.company} / v{snapshot.ledgerVersion}</dd><dt>데이터 기준</dt><dd>{displayTime(snapshot.asOf)} · 스냅샷</dd>{Object.entries(selected.properties).map(([key,value])=><React.Fragment key={key}><dt>{key}</dt><dd>{value}</dd></React.Fragment>)}<dt>근거 참조</dt><dd>{selected.evidence.length?selected.evidence.map(id=><code className="gv-evidence" key={id}>{id}</code>):'근거 미등록'}</dd></dl></>:<p>객체를 선택하세요.</p>}</aside></div>
 <section className="gv-panel"><div className="gv-panel-head"><div><h2>방향·범위·근거가 있는 관계 목록</h2><span>선택 객체 연결 {related.length}개 · 표시 {relationRows.length}개</span></div><span>장착·호환성·결함·도착 자동 확정 없음</span></div><div className="gv-table-scroll"><table><thead><tr><th>출발 객체</th><th>관계 → / 유형</th><th>도착 객체</th><th>적용 범위</th><th>확인된 기간</th><th>근거</th></tr></thead><tbody>{relationRows.map(edge=><tr key={edge.id}><td><button className="gv-link" onClick={()=>choose(edge.from)}>{edge.from}</button></td><td>{edge.label}<small>{relationNames[edge.type]}</small></td><td><button className="gv-link" onClick={()=>choose(edge.to)}>{edge.to}</button></td><td>{edge.scope}</td><td>{edge.validFrom??'시작 미확인'}<small>~ {edge.validTo??'종료 미확인'}</small></td><td><code>{edge.evidence}</code></td></tr>)}{!related.length&&<tr><td colSpan={6}>현재 선택·유형 조건의 등록 관계 없음 · 미장착 확정 아님</td></tr>}</tbody></table></div><Pager page={relationPage} total={related.length} size={8} change={RelationPage}/></section>
 <section className="gv-panel"><div className="gv-panel-head"><div><h2>전체 전달 객체 목록</h2><span>회사 {snapshot.companyId} · 로드 {snapshot.entities.length}개 / 관계 {snapshot.relations.length}개 · 로컬 전달분 정확 집계</span></div><label className="gv-search"><Search size={15}/><input aria-label="그래프 객체 검색" placeholder="객체명 · ID · 유형" value={query} onChange={e=>Query(e.target.value)}/></label></div><div className="gv-table-scroll"><table><thead><tr><th>객체명 / ID</th><th>유형</th><th>개정</th><th>상태</th><th>자료 구분</th><th>데이터 버전</th></tr></thead><tbody>{rows.map(entity=><tr key={entity.id} className={entity.id===selectedId?'selected':''} aria-selected={entity.id===selectedId}><td><button className="gv-link" onClick={()=>choose(entity.id)}>{entity.name}</button><small><code>{entity.id}</code></small></td><td>{entity.type}</td><td>{entity.revision}</td><td>{entity.status}</td><td>{entity.source}</td><td>v{snapshot.ledgerVersion}</td></tr>)}{!rows.length&&<tr><td colSpan={6}>조건에 맞는 객체가 없습니다.</td></tr>}</tbody></table></div><Pager page={page} total={visibleEntities.length} size={12} change={Page}/><p className="gv-graph-note">전체 운영 객체 수는 미집계입니다. 100,000개 구축 목표를 현재 실적으로 표시하지 않습니다. 그래프 상세 가드레일 300노드 / 800관계 · 현재 미니 그래프는 최대 11노드.</p></section>
 <section className="gv-panel"><div className="gv-panel-head"><div><h2>저장 초안 · 승인 · 반영 관찰</h2><span>작성 중 미저장 입력은 전송하지 않습니다. 승인 상태가 바뀌어도 업무 데이터 버전은 그대로일 수 있습니다.</span></div></div><div className="gv-table-scroll"><table><thead><tr><th>초안 ID / 정확 해시</th><th>초안 버전</th><th>작성자 → 승인자</th><th>검토 상태</th><th>기준 데이터</th><th>업무 반영</th></tr></thead><tbody>{snapshot.reviews.slice(reviewPage*30,reviewPage*30+30).map(draft=><tr key={draft.id}><td><code>{draft.id}</code><small title={draft.hash}>{draft.hash.slice(0,16)}…</small></td><td>v{draft.version}</td><td>{draft.author} → {draft.approvedBy??'승인 대기'}</td><td>{draft.status}</td><td>v{draft.base}</td><td>{draft.status==='반영 완료'?'로컬 반영 완료':'미반영 · 현재 수량에 미합산'}</td></tr>)}{!snapshot.reviews.length&&<tr><td colSpan={6}>저장된 검토 초안 없음</td></tr>}</tbody></table></div><Pager page={reviewPage} total={snapshot.reviews.length} size={30} change={ReviewPage}/><p className="gv-graph-note">전달된 전체 {snapshot.reviews.length}개 검토를 페이지로 확인할 수 있습니다. 상세 검토·승인은 업무 화면에서 수행합니다. 새 승인 정책을 만들거나 그래프에서 승인하지 않습니다.</p></section>
 </>}
 </>}
 <footer>브라우저 Mock → 로컬 투영 서버 → 별도 그래프 화면 · 서버 재시작·계정 전환 시 다시 연결 · 입고와 LOT-L07 연결 근거 없음 / RES-01은 타 계획 예약 20 EA</footer></main></div>;
}
function Pager({page,total,size,change}:{page:number;total:number;size:number;change:(page:number)=>void}){return <div className="gv-pager"><span>검색 {total}개 · 표시 {total?Math.min(page*size+1,total):0}–{Math.min((page+1)*size,total)}</span><div><button aria-label="이전 페이지" disabled={!page} onClick={()=>change(page-1)}><ArrowLeft size={14}/></button><span>{page+1} / {Math.max(1,Math.ceil(total/size))}</span><button aria-label="다음 페이지" disabled={(page+1)*size>=total} onClick={()=>change(page+1)}><ArrowRight size={14}/></button></div></div>}

createRoot(document.getElementById('root')!).render(<GraphView/>);
