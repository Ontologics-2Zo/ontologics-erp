import {ChangeImpactPanel} from './change-impact';
import {BomRegistrationChanges} from './bom-registration-changes';
import {BomReviewPanel} from './bom-review-panel';
import {useRef,type ReactNode} from 'react';
import {ArrowRight,FileText,ShieldCheck} from 'lucide-react';
import {useApp} from './context';
import {Badge,Button,Notice,Panel,Field,useStored} from './ui';
import {useEntity} from './entity';
import {EntityThumbnail} from './media';
import {ProductSourceTable,ProductBomTable,ProductRegistrationTable} from './product-tables';
import {actualBoms,actualBomList,actualBomForSource,type ActualBomKey} from './actual-boms';
import catalog from './catalog.json';
import {buildBomRegistrationPayload,expectedBomMapping,getBomRegistration,isBomRegistered,resolveBomRegistration} from './bom-registration';
function PageTitle({id,title,sub,action}:{id:string;title:string;sub:string;action?:ReactNode}){return <div className="page-title"><div><span className="eyebrow">{id} / MANUFACTURING OPERATIONS</span><h1>{title}</h1><p>{sub}</p></div>{action}</div>}
function Req({ids}:{ids:string}){return <div className="req"><ShieldCheck size={13}/>{ids}</div>}
export function Product(){
 const {s,submit,busy,evidence,go,toast,run}=useApp(),ctx=useEntity();
 const [step,setStep]=useStored('productStep',0),[legacyReviewed]=useStored('sourceReviewed',false),[reviewedSnapshots,setReviewedSnapshots]=useStored<Partial<Record<ActualBomKey,boolean>>>('sourceReviewBySnapshot',{}),[mapping,setMapping]=useStored('mapping','WROOM');
 const [,setOpenReview]=useStored('workflow-view-review-open',''),[,setOntologyTab]=useStored('workflow-view-ontology-tab','map');
 const [storedRevision,setRevision]=useStored<ActualBomKey>('workflow-view-product-revision','L1'),[onlyDiff,setOnlyDiff]=useStored('workflow-view-product-differences',false),[uploaded,setUploaded]=useStored('upload','');
 const revision=actualBoms[storedRevision]?storedRevision:'L1',definition=actualBoms[revision],source=catalog.find(item=>item.id===definition.sourceId)!;
 const isPoe=revision==='L'||revision==='L1',registrationSourceMatches=uploaded===source.sha256,registered=isBomRegistered(s,revision),registration=getBomRegistration(s,revision);
 const reviewed=reviewedSnapshots[revision]??(revision==='L1'&&legacyReviewed),setReviewed=(value:boolean)=>setReviewedSnapshots({...reviewedSnapshots,[revision]:value});
 const matchingDrafts=s.drafts.filter(d=>{try{return d.payload.kind==='bom'&&resolveBomRegistration(d.payload).key===revision}catch{return false}}),latestDraft=matchingDrafts[0];
 const openReview=(id:string)=>{setOpenReview(id);go('UI05')};
 const all=definition.lines.map(r=>{
  const old=isPoe?actualBoms.L.lines.find(l=>l.cells[3]===r.cells[3]):undefined;
  return {...r,quantity:r.cells[0],item:r.cells[1],position:r.cells[3],mount:'미확인',diff:revision==='L1'?(!old||old.cells.join('|')!==r.cells.join('|')?'변경':'동일'):revision==='L'?'기준 개정':'비교 원본 없음'};
 });
 const rows=onlyDiff&&revision==='L1'?all.filter(r=>r.diff==='변경'):all;
 const rememberedSelection=useRef<Partial<Record<ActualBomKey,string>>>({});
 const selectRevision=(key:ActualBomKey)=>{
  if(ctx.selectedId===definition.configurationId||ctx.selectedId.startsWith(definition.partPrefix+'-'))rememberedSelection.current[revision]=ctx.selectedId;
  setRevision(key);ctx.select(rememberedSelection.current[key]??actualBoms[key].configurationId,false);
 };
 const receive=(id:string)=>{const item=catalog.find(c=>c.id===id)!,bom=actualBomForSource(id)!;setUploaded(item.sha256);setReviewedSnapshots({...reviewedSnapshots,[bom.key]:false});selectRevision(bom.key);setStep(1)};
 const upload=async(file?:File)=>{if(!file)return;await run(async()=>{
  if(!/\.(ods|pdf|csv)$/i.test(file.name)||file.size>5*1024*1024)throw new Error('지원 형식은 포함된 ODS/PDF/CSV, 최대 5MB입니다. 범용 추출은 지원하지 않습니다.');
  const h=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
  const match=catalog.find(c=>c.sha256===h);if(!match)throw new Error('포함 원본 해시와 다릅니다. 범용 추출은 미연동이며 확정 저장하지 않았습니다.');
  if(uploaded===h)throw new Error('동일 원본·대상·매핑이 이미 접수되었습니다.');receive(match.id);toast('포함 원본 해시 일치 · 접수 완료');
 })};
 return <><PageTitle id="UI02" title={step===2?`${definition.modelName} · ${definition.revision} BOM 정합성 검토`:"제품 구성·BOM"} sub="실제 4모델·5스냅샷 356원문 행 · 원본 확보와 독립 검수·매핑·승인·반영은 구분합니다." action={step!==2&&<Button onClick={()=>setStep(2)}>BOM · 정합성 검토</Button>}/>
  <div className="toolbar" data-view-state="true"><Field label="실제 BOM 스냅샷"><select aria-label="실제 BOM 스냅샷" value={revision} onChange={event=>selectRevision(event.target.value as ActualBomKey)}>{actualBomList.map(item=><option key={item.key} value={item.key}>{item.modelName} / {item.revision}{item.key==='L'||item.key==='L1'?' WROOM':''} · {item.lines.length}행</option>)}</select></Field><Badge tone="amber">전체 원문 행의 실장·단위·MPN 미검수</Badge></div>
  <div className="steps">{['원본 접수','추출 정보 확인','BOM · 정합성 검토','초안 · 검토 요청'].map((x,i)=><button key={x} className={step===i?'active':''} onClick={()=>setStep(i)}><span>{i+1}</span>{x}</button>)}</div>
  <div className={step===2?'product-review-layout':''}><Panel title={`${definition.modelName} · ${definition.revision}${isPoe?' WROOM':''}`} subtitle={`OLIMEX 공개 설계 · 고정 커밋 ${source.commit.slice(0,12)}…`} action={<div className="badge-row">{ctx.resolve(definition.configurationId)&&<EntityThumbnail entity={ctx.resolve(definition.configurationId)!} size="small" interactive/>}<Badge tone={registration?'green':'amber'}>{registration?'시연 승인 구성 반영':registered?'이전 L1 반영 기록 · 원본 연결 미확인':'원본 확보 · 독립 검수 전'}</Badge></div>}><div className="inset">
   {isPoe?<Notice tone="warning">원본 파일명은 WROOM, 내부 시트명은 {definition.worksheetLabels.join(' / ')}입니다. 대상 불일치 경고와 NA·NS·Opened를 보존하며 개정 간 부품 동일성을 추정하지 않습니다.</Notice>:<Notice tone="warning">실제 CSV 전체 원문을 확보했습니다. 파일명 개정은 {definition.revision}이며 구성 변형·실장 여부·단위·정확 MPN은 미검수입니다. 빈 참조 위치와 Ref**·NA·NS·Opened·Closed는 원문 그대로 유지합니다.</Notice>}
   {step===0?<><ProductSourceTable uploaded={uploaded}/><div className="upload"><FileText size={30}/><h3>원본 자료 접수</h3><p>지원: 포함된 5스냅샷의 ODS·CSV 및 PoE 대응 PDF · 최대 5MB · 범용 OCR 미연동</p><input aria-label="원본 파일 선택" type="file" accept=".ods,.pdf,.csv" onChange={e=>upload(e.target.files?.[0])}/><div className="actions"><Button primary onClick={()=>receive(source.id)}>선택한 원본으로 시작</Button><Button onClick={()=>receive('SRC-L1-ods')}>포함된 L1 원본으로 시작</Button></div></div><div className="form-grid">{isPoe?<Field label="PoE 등록 대상 변형"><select value={mapping} onChange={e=>{setMapping(e.target.value);setReviewed(false)}}><option>WROOM</option><option>WROVER</option></select></Field>:<Field label="등록 구성 ID"><input readOnly value={definition.configurationId}/></Field>}<Field label="원본 구분"><input readOnly value="실제 공개 OLIMEX 원본 · 구조적 파싱 후보"/></Field></div></>:<><div className="toolbar">{isPoe&&<div className="segmented"><button className={revision==='L1'?'active':''} onClick={()=>selectRevision('L1')}>L1 구성</button><button className={revision==='L'?'active':''} onClick={()=>selectRevision('L')}>L 구성</button></div>}<label className="check" data-view-state="true"><input type="checkbox" disabled={revision!=='L1'} checked={onlyDiff&&revision==='L1'} onChange={e=>setOnlyDiff(e.target.checked)}/>{step===2?'하단 원문 표: 변경 항목만':'변경 항목만 보기'} · PoE L 대비 L1</label><Button onClick={()=>evidence(source.id)}>원본·해시 확인</Button></div>{step!==2&&step!==3&&<ProductBomTable revision={revision} rows={rows}/>}</>}
   {step===2&&<><BomReviewPanel revision={revision} mapping={isPoe?mapping:''} uploaded={uploaded} reviewed={reviewed} onRegistration={()=>setStep(3)}/><details className="bom-review-original"><summary>개정 변경 요약 · BOM 원문 전체 보기</summary><div className="comparison"><h3>같은 위치의 원문 비교 · 호환성 확정 아님</h3>{isPoe?<><p>U2: TPS2376D(SO-8) → TPS2375D(SO-8)</p><p>R6: 2.2k 그룹 → 10k 그룹 · R50 / R51: NA 표기로 변경</p><small>PoE L/L1 추출 행 비교입니다. 개정 간 동일 부품 병합이나 대체 호환성을 승인하지 않습니다.</small></>:<p>현재 모델의 다른 개정 원본은 포함되어 있지 않아 개정 비교는 미검증입니다.</p>}</div><ProductBomTable revision={revision} rows={rows}/></details></>}
   {step===3&&<><ProductRegistrationTable revision={revision} mapping={isPoe?mapping:expectedBomMapping(revision)} reviewed={reviewed} uploaded={uploaded}/>{!registrationSourceMatches&&<Notice tone="warning">접수 원본이 {revision==='L1'?'L1 ODS':`${definition.modelName} ${definition.revision}`} 등록 근거와 다릅니다. 원본 접수에서 선택 구성의 {source.filename.split('.').pop()?.toUpperCase()} 원본을 선택한 후 등록 초안을 저장하세요.</Notice>}<label className="check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>{isPoe?'시트명 불일치와 미확인 항목을 확인했으며 미확인 상태로 보존합니다.':'원본의 미기재·중복·미확인 항목을 확인했으며 미확인 상태로 보존합니다.'}</label><Notice>승인 시연은 원문과 미확인 상태를 포함하는 등록 검토입니다. 실장·단위·정확 품번을 검증 완료로 바꾸거나 생산계획의 확정 소요로 자동 전환하지 않습니다.</Notice><BomRegistrationChanges snapshotKey={revision}/></>}
   {registered&&<Notice tone="success">{definition.modelName} / {definition.revision}의 등록 검토가 로컬에 반영되었습니다. {registration?`초안 ${registration.draftId} · v${registration.draftVersion} · 반영 데이터 v${registration.appliedDataVersion}`:'이전 L1 반영 기록 · 세부 승인 연결 미등록'} · 원문 미검수 상태는 유지합니다.</Notice>}
   <div className="actions">{step===2?<Button onClick={()=>go('UI05')}>검토·승인으로 이동</Button>:step<3?<Button primary onClick={()=>setStep(step+1)}>다음 단계 확인 <ArrowRight size={16}/></Button>:<Button primary disabled={busy||!registrationSourceMatches||!!registration} title={registration?'이 원본 스냅샷의 등록이 이미 반영되었습니다. 기존 기록을 확인하세요.':!registrationSourceMatches?'선택 구성의 원본 해시 접수가 필요합니다.':undefined} onClick={()=>{if(!registrationSourceMatches||registration)return;submit(buildBomRegistrationPayload(revision,{mapping:isPoe?mapping:expectedBomMapping(revision),reviewed,receivedSourceHash:uploaded}),revision==='L1'?'L1 WROOM 구성 등록':`${definition.modelName} ${definition.revision} 구성 등록`,'UI02')}}>등록 초안 저장</Button>}{step!==2&&<Button onClick={()=>go('UI05')}>검토·승인으로 이동</Button>}{latestDraft&&<Button onClick={()=>openReview(registration?.draftId??latestDraft.id)}>선택 구성의 저장 초안 확인</Button>}{registered&&<Button onClick={()=>{ctx.select(definition.configurationId,false);setOntologyTab('map');go('MAP')}}>반영 후 ABox 객체·관계 확인</Button>}{registered&&revision==='L1'&&<Button onClick={()=>go('UI07')}>승인 구성으로 계획 검토</Button>}</div>
  </div></Panel></div><ChangeImpactPanel kind="bom" snapshotKey={revision}/><Req ids="REG-01~04 · RV01~03 · CM01 · AT01"/>
 </>;
}
