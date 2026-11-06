import {useEffect,useId,useMemo,useState} from 'react';
import {AlertTriangle,ArrowRight,Box,CheckCheck,ClipboardList,FileText,Layers,MapPin,Network,RefreshCw,Table2} from 'lucide-react';
import {auditBom,type BomCheck} from './bom-consistency';
import catalog from './catalog.json';
import {actualBoms,type ActualBomKey} from './actual-boms';
import {useApp} from './context';
import {EntityChip,useEntity} from './entity';
import {SNAPSHOT_AT,type Entity,type Relation} from './entity-data';
import {MediaPanel,EntityThumbnail} from './media';
import {BomComponentGraph} from './bom-component-graph';
import type {QueryResult} from './ports';
import {Badge,Button,Modal,Notice,useStored} from './ui';
import {WorkflowTable} from './workflow-tables';
import './bom-review-panel.css';

type Props={revision:ActualBomKey;mapping:string;uploaded:string;reviewed:boolean;onRegistration:()=>void};
type GraphResult=QueryResult<Entity>&{relations:Relation[];relationTotal:number;complete:boolean};
const tone=(status:BomCheck['status'])=>status==='불일치'?'red':status==='미확인'||status==='미접수'?'amber':status==='형식 일치'||status==='범위 일치'?'blue':'gray';
const priority:Record<BomCheck['status'],number>={'불일치':0,'미확인':1,'미접수':2,'미검증':3,'범위 일치':4,'형식 일치':5};
const filters=['전체','확인 필요','불일치','미확인','미검증','형식·범위 일치','미접수'] as const;
const dateLabel=(value:string)=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false});
// Full comparisons remain in the read-only dialog; the grid emphasizes the deciding notation.
const comparisonSummary=(check:BomCheck)=>check.category==='BOM 행'?check.comparison
 .replace('NA·NS·Opened·Closed 원문 표기: 미확인 보존, DNP·정상 제외로 변환하지 않음','NA·NS·Opened·Closed · 의미 미확인')
 .split(' / ').filter(part=>part!=='참조 위치 중복 없음'&&part!=='패키지 원문 표기 있음 · 적합성 미검증').join(' / '):check.comparison;

/** Read-only source checks. Registration still uses the existing draft/review/action flow. */
export function BomReviewPanel({revision,mapping,uploaded,reviewed,onRegistration}:Props){
 const {evidence,s}=useApp(),ctx=useEntity(),configurationId=actualBoms[revision].configurationId,configuration=ctx.resolve(configurationId);
 const [run,rerun]=useState(0),[filter,setFilter]=useStored<string>('workflow-view-bom-integrity-filter','전체'),[detail,setDetail]=useState<BomCheck|null>(null);
 const audit=useMemo(()=>({...auditBom({revision,mapping,uploaded}),checkedAt:new Date().toISOString()}),[revision,mapping,uploaded,run]);
 const source=catalog.find(item=>item.id===actualBoms[revision].sourceId)!;
 const rows=useMemo(()=>audit.checks.filter(check=>filter==='전체'||(filter==='확인 필요'?['불일치','미확인'].includes(check.status):filter==='형식·범위 일치'?['형식 일치','범위 일치'].includes(check.status):check.status===filter)).sort((a,b)=>priority[a.status]-priority[b.status]),[audit,filter]);
 const mismatchCount=audit.checks.filter(check=>check.status==='불일치').length;
 const unknownCheckCount=audit.checks.filter(check=>check.status==='미확인').length;
 const showDetail=(check:BomCheck)=>{if(check.entityId&&ctx.resolve(check.entityId))ctx.select(check.entityId,false);setDetail(check)};
 useEffect(()=>setDetail(null),[revision,ctx.company,ctx.portContext.identityRevision]);
 if(!configuration)return <Notice tone="warning">현재 회사 범위에서 이 제품 구성에 접근할 수 없습니다.</Notice>;
 return <section className="bom-review" aria-label="BOM 정합성 검토 작업 공간">
  <div className="bom-review-heading"><div><span className="bom-review-eyebrow">PRODUCT INFORMATION · SOURCE REVIEW</span><h2>BOM · 정합성 검토 <Badge tone="amber">확인 항목 있음</Badge></h2><p>원본 표기와 등록 대상을 확인하고, 미확인 항목을 보존합니다.</p></div><EntityChip id={configurationId} showMedia={false}/></div>
  <div className="bom-review-metrics">
   <div className="bom-review-metric"><ClipboardList/><div><span>BOM 원문 항목</span><strong>{audit.rowCount}<small>행</small></strong><p>실제 공개 원본 · Rev {actualBoms[revision].revision}</p></div></div>
   <div className="bom-review-metric"><MapPin/><div><span>참조 위치 표기</span><strong>{audit.referenceCount??`${audit.knownReferenceCount} + 미확인`}{audit.referenceCount!==null&&<small>개</small>}</strong><p>{audit.unparsedPositionRows?`참조 해석 미확인 ${audit.unparsedPositionRows}행 별도`:'원문 위치 수 · 실제 장착 수 아님'}</p></div></div>
   <button className="bom-review-metric attention" onClick={()=>setFilter('확인 필요')} title="불일치·미확인 검사 항목 보기"><AlertTriangle/><div><span>확인 필요 검사 항목</span><strong>{audit.issueCount}<small>건</small></strong><p>불일치 {mismatchCount} · 미확인 {unknownCheckCount}건</p></div></button>
   <div className="bom-review-metric"><CheckCheck/><div><span>등록 입력 확인</span><strong className="bom-review-stage">{reviewed?'보존 확인함':'보존 확인 전'}</strong><p>등록 검토 단계에서 확인 · 승인과 별도</p></div></div>
  </div>
  <div className="bom-review-overview">
   <section className="bom-review-card bom-review-photo"><div className="bom-review-card-title"><h3><Box size={16}/> 보드 참고 이미지</h3><Badge>개정 일치 미검수</Badge></div><div className="bom-review-photo-content"><MediaPanel entity={configuration}/><div className="bom-review-photo-meta"><EntityChip id={configurationId} showMedia={false}/><span>부품 좌표 미등록</span></div></div></section>
   <BomReviewRelations revision={revision} onCheck={id=>{const check=audit.checks.find(item=>item.entityId===id&&item.category==='BOM 행');if(check)showDetail(check)}}/>
  </div>
  <section className="bom-review-card bom-review-checks">
   <div className="bom-review-card-title"><div><h3><CheckCheck size={16}/> 원본 · BOM 정합성 검사</h3><p>검사 항목 수이며 불량 부품 수가 아닙니다. 회로도·데이터시트 교차 검토는 미연결입니다.</p></div><label className="bom-review-filter" data-view-state="true"><span>판정</span><select aria-label="정합성 판정 필터" value={filter} onChange={event=>setFilter(event.target.value)}>{filters.map(value=><option key={value} value={value}>{value}</option>)}</select></label></div>
   <WorkflowTable<BomCheck> tableKey={`bom-integrity-${revision}`} data={rows} getRowId={check=>check.id} contextId={check=>check.entityId} pageSizes={[5,15,30]} searchLabel="부품·참조 위치·원문·판정 검색" columns={[
    {id:'target',header:'대상 · 위치',accessorFn:check=>`${check.target} ${check.category} ${check.entityId??''}`,cell:cell=>{const check=cell.row.original;return <div className="bom-review-target"><strong>{check.target}</strong><small>{check.category}{check.row?` · 원문 행 ${check.row}`:''}</small>{check.entityId&&<EntityChip id={check.entityId} compact showMedia={false}/>}</div>}},
    {id:'bom',header:'BOM 기준',accessorFn:check=>check.bomValue,cell:cell=><span className="bom-review-value">{cell.row.original.bomValue}</span>},
    {id:'comparison',header:'대조 근거 · 범위',accessorFn:check=>check.comparison,cell:cell=><span className="bom-review-comparison">{comparisonSummary(cell.row.original)}</span>},
    {id:'status',header:'판정',accessorFn:check=>check.status,cell:cell=><Badge tone={tone(cell.row.original.status)}>{cell.row.original.status}</Badge>},
    {id:'action',header:'조치 · 원문',accessorFn:check=>`${check.action} ${check.sourceId}`,cell:cell=>{const check=cell.row.original;return <div className="bom-review-row-actions"><Button data-focus-key={`bom-integrity-${check.id}`} onClick={()=>showDetail(check)}>근거 비교</Button><button className="text-btn" onClick={()=>evidence(check.sourceId,check.row)}><FileText size={12}/>{check.row?`원문 ${check.row}행`:check.sourceId}</button></div>}},
   ]} footer={`원문 표기·형식 미확인 ${audit.unknownRows}행 / 해당 참조 표기 ${audit.unknownReferences}개. 전체 ${audit.rowCount}행의 실장·단위·MPN은 미검수입니다. DNP·정상 제외 또는 장착 여부를 추정하지 않습니다.`}/>
  </section>
  <div className="bom-review-basis"><FileText size={15}/><div><button className="text-btn" onClick={()=>evidence(source.id)}>{source.filename}</button><span title={source.sha256}>SHA-256 <code>{source.sha256.slice(0,16)}…</code> · 공개 원본 commit <code>{source.commit.slice(0,8)}</code></span><small>화면 스냅샷 {dateLabel(SNAPSHOT_AT)} KST · 데이터 v{s.version} · 로컬 형식 검사 {dateLabel(audit.checkedAt)} KST</small></div></div>
  <div className="bom-review-actions"><div><strong>원문 검토 → 등록 초안 → 검토·승인 → 정확 버전 반영</strong><span>형식 일치는 부품 호환성·회로 동작·제조 품질의 검증이 아닙니다.</span></div><Button onClick={()=>rerun(value=>value+1)}><RefreshCw size={15}/> 검증 다시 실행</Button><Button primary onClick={onRegistration}>등록 검토 단계 <ArrowRight size={15}/></Button></div>
  <Modal open={!!detail} onClose={()=>setDetail(null)} title="BOM 정합성 근거 비교" description="현재 원본의 표기와 비교 범위를 읽기 전용으로 확인합니다.">
   {detail&&<div className="bom-review-detail"><div className="bom-review-detail-heading"><Badge tone={tone(detail.status)}>{detail.status}</Badge><strong>{detail.target}</strong></div>{detail.entityId&&<EntityChip id={detail.entityId} showMedia={false}/>}<dl><dt>BOM 기준</dt><dd>{detail.bomValue}</dd><dt>대조 근거</dt><dd>{detail.comparison}</dd><dt>판정 범위</dt><dd>{detail.note}</dd><dt>다음 확인</dt><dd>{detail.action}</dd><dt>원문 위치</dt><dd>{detail.sourceId}{detail.row?` / 행 ${detail.row}`:''}</dd></dl><Notice>이 확인 창은 원본·업무 데이터를 변경하지 않습니다. 승인·등록은 기존 검토 절차에서 별도로 처리합니다.</Notice><div className="bom-review-detail-actions"><Button onClick={()=>{const check=detail;setDetail(null);evidence(check.sourceId,check.row)}}><FileText size={15}/> 원문 근거 열기</Button><Button onClick={()=>setDetail(null)}>확인</Button></div></div>}
  </Modal>
 </section>;
}

function BomReviewRelations({revision,onCheck}:{revision:ActualBomKey;onCheck:(id:string)=>void}){
 const ctx=useEntity(),{evidence}=useApp(),root=actualBoms[revision].configurationId,marker=useId().replace(/:/g,''),[view,setView]=useState<'graph'|'list'>('graph');
 const graphKey=`${root}:${ctx.company}:${ctx.portContext.actor}:${ctx.portContext.identityRevision}:${ctx.portContext.dataVersion}:${ctx.portContext.asOf??''}`;
 const [result,setResult]=useState<{key:string;graph?:GraphResult;error?:string}>({key:''});
 const definition=actualBoms[revision];
 const preferred=definition.lines.find(row=>row.cells[3]==='U2')??definition.lines[0];
 const selectedPart=ctx.selectedId.startsWith(definition.partPrefix+'-')?ctx.selectedId:definition.partPrefix+'-'+preferred.row;
 useEffect(()=>{let live=true;ctx.ports.graph.neighborhood(root,ctx.portContext).then(graph=>{if(live)setResult({key:graphKey,graph})}).catch(error=>{if(live)setResult({key:graphKey,error:error instanceof Error?error.message:String(error)})});return()=>{live=false}},[graphKey]);
 const current=result.key===graphKey?result:undefined,graph=current?.graph;
 const ids=[definition.modelId,root,selectedPart],nodes=ids.map(id=>graph?.data.find(entity=>entity.id===id));
 const shown=graph?.relations.filter(relation=>relation.type==='design'&&((relation.from===ids[0]&&relation.to===ids[1])||(relation.from===ids[1]&&relation.to===ids[2])))??[];
 const openEvidence=(reference:string)=>{const match=/^(.*?)\s*\/\s*행\s*(\d+)$/.exec(reference);match?evidence(match[1],Number(match[2])):evidence(reference)};
 return <section className="bom-review-card bom-review-relations"><div className="bom-review-card-title"><h3><Network size={16}/> 보드 · BOM · 원문 품목 관계</h3><div className="bom-review-view" data-view-state="true"><button className={view==='graph'?'active':''} aria-pressed={view==='graph'} onClick={()=>setView('graph')}><Network size={13}/> 그래프</button><button className={view==='list'?'active':''} aria-pressed={view==='list'} onClick={()=>setView('list')}><Table2 size={13}/> 전체 관계</button></div></div>
  {!current?<div className="bom-review-graph-message" role="status">관계 조회 중</div>:current.error?<Notice tone="warning">관계 조회 실패 · {current.error}</Notice>:graph&&<>{view==='graph'?<>
   <div className="bom-review-topology"><svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-hidden="true"><defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="var(--graph-line)"/></marker></defs>{shown.map(relation=>{const start=ids.indexOf(relation.from),end=ids.indexOf(relation.to);return <path key={relation.id} d={`M${start*210+180} 75 L${end*210+3} 75`} stroke="var(--graph-line)" strokeWidth="2" markerEnd={`url(#${marker})`}/>})}</svg>
    {nodes.map((entity,index)=>entity?<div key={entity.id} className={'bom-review-node '+(ctx.selectedId===entity.id?'selected':'')}>{index===2?<EntityThumbnail entity={entity} size="tiny" interactive/>:index===0?<Box size={18}/>:<Layers size={18}/>}<button className="bom-review-node-select" onClick={()=>ctx.select(entity.id,false)} aria-label={`${entity.name} 객체 선택`} aria-pressed={ctx.selectedId===entity.id}><small>{entity.type}</small><strong>{entity.name}</strong><code>{entity.id}</code></button></div>:<div className="bom-review-node missing" key={ids[index]}>객체 조회 미확인</div>)}
   </div>
   <div className="bom-review-edge-list">{shown.map(relation=><div key={relation.id}><span><ArrowRight size={12}/><strong>{relation.label}</strong> · {relation.scope}</span><button className="text-btn" onClick={()=>openEvidence(relation.evidence)}>{relation.evidence}</button></div>)}{!shown.length&&<p>조회된 설계 관계가 없습니다. 미장착을 뜻하지 않습니다.</p>}</div>
  </>:<WorkflowTable<Relation> tableKey={`bom-integrity-relations-${revision}`} data={graph.relations} getRowId={relation=>relation.id} contextId={relation=>relation.to} pageSizes={[5,15,30]} searchLabel="관계·적용 범위 검색" columns={[
   {id:'from',header:'출발 객체',accessorFn:relation=>ctx.resolve(relation.from)?.name??relation.from,cell:cell=><EntityChip id={cell.row.original.from} compact showMedia={false}/>},
   {id:'relation',header:'관계 → 적용 범위',accessorFn:relation=>`${relation.label} ${relation.scope}`,cell:cell=><span className="bom-review-relation-value"><strong>{cell.row.original.label} →</strong><small>{cell.row.original.scope}</small><small>{cell.row.original.validFrom??'시작 미확인'} · {cell.row.original.validTo??'종료 미확인'}</small></span>},
   {id:'to',header:'도착 객체',accessorFn:relation=>ctx.resolve(relation.to)?.name??relation.to,cell:cell=><EntityChip id={cell.row.original.to} compact showMedia={false}/>},
   {id:'evidence',header:'근거',accessorFn:relation=>relation.evidence,cell:cell=><button className="text-btn" onClick={()=>openEvidence(cell.row.original.evidence)}>{cell.row.original.evidence}</button>},
  ]} footer="제품 구성의 조회된 전체 관계 · 설계 관계는 실제 장착 증거가 아닙니다."/>}
  <BomComponentGraph key={revision} revision={revision} graph={graph} onCheck={onCheck}/>
  <div className="bom-review-graph-footer"><span>조회 {graph.meta.total??'미집계'}객체 / {graph.relationTotal}관계 · 로드 {graph.meta.loaded}객체 / {graph.relations.length}관계{view==='graph'?` · 표시 ${nodes.filter(Boolean).length}객체 / ${shown.length}관계`:''}</span><span>{graph.complete?'범위 내 전체 로드':'부분 결과'} · {view==='graph'?'공개 BOM · ':''}로컬 관계 v{graph.meta.dataVersion}</span></div>
  </>}
 </section>;
}
