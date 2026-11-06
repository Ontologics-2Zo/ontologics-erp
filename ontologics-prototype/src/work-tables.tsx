import {useState} from 'react';
import {ArrowUpRight,ImageOff,Info,ChevronRight} from 'lucide-react';
import {useApp} from './context';
import {Badge,Button,DataTable,Modal,Notice,useStored} from './ui';
import {EntityChip,SourceBadge,useEntity} from './entity';
import {EntityThumbnail} from './media';
import {buildConfigurationItems,type WorkItem,type WorkStatus,type ConfigurationItem} from './work-items';
import './work-tables.css';

function StatusCell({value}:{value:WorkStatus}){return <span className="work-status" title={value.detail}><Badge tone={value.tone}>{value.label}</Badge></span>}
function PhotoCell({id}:{id?:string}){const {resolve}=useEntity(),entity=id?resolve(id):undefined;return entity?<EntityThumbnail entity={entity} size="small" interactive/>:<span className="work-photo-unknown" aria-label="보드 구성 연결 미확인"><ImageOff size={18}/><small>연결 미확인</small></span>}
function DataBasis({version,onClick}:{version:number;onClick:()=>void}){return <button className="basis-link" onClick={onClick}><span>09.20 12:00</span><small>스냅샷 · v{version} <Info size={11}/></small></button>}
function Unknowns({items,onClick}:{items:string[];onClick:()=>void}){return <button className="unknowns-link" onClick={onClick}><span>확인 필요 {items.length}건 <ChevronRight size={12}/></span><small>{items[0]??'등록된 미확인 항목 없음'}</small></button>}

export function WorkQueueTable({items}:{items:WorkItem[]}){
 const {select,selectedId,selected}=useEntity(),{go}=useApp();
 const [active,A]=useStored('home-active-work',''),[details,D]=useState<WorkItem|null>(null);
 const activate=(row:WorkItem)=>{A(row.id);select(row.contextObjectId,false)};
 const inspectBoard=(row:WorkItem)=>{A(row.id);select(row.configId??row.objectId)};
 return <div className="dense-workspace-table work-queue-table" data-work-grid="queue">
  <div className="list-context-bar"><span>사진 <strong>확대·출처</strong><i/>이름 <strong>객체 상세·관계</strong><i/>행 선택 <strong>AI 맥락 공유</strong></span><span>현재 객체 <code>{selectedId}</code></span></div>
  <DataTable data={items} viewStateKey="home-work-queue" searchLabel="업무·보드·대상 검색" activeRowId={items.some(r=>r.id===active&&(r.contextObjectId===selectedId||r.configId===selectedId))?active:undefined} onActiveRow={activate} pageSizes={[5,15,30]} columns={[
   {id:'photo',header:'보드 사진',enableHiding:false,cell:c=><PhotoCell id={c.row.original.boardId??c.row.original.configId}/>},
   {id:'object',accessorFn:r=>`${r.modelName??''} ${r.revision??''} ${r.configLabel} ${r.configId??''} ${r.objectId} ${r.title} ${r.group}`,header:'모델 · 개정 / 업무 대상',enableHiding:false,cell:({row:{original:r}})=><div className="work-object"><button className="work-object-name" onClick={()=>inspectBoard(r)}>{r.modelName??(r.group==='입고 대기'?'MLCC 구매 업무':'1차 납품회차')}{r.revision&&<span className="revision-tag">{r.revision}</span>}<ArrowUpRight size={12}/></button><span className="work-configuration">{r.configLabel}</span><span className="work-object-reference"><span className="work-group">{r.group}</span><EntityChip id={r.objectId} compact={r.objectId===r.configId} showMedia={false}/></span></div>},
   {id:'quantity',accessorFn:r=>r.quantity.value??undefined,header:'수량 / 단위',sortUndefined:'last',sortingFn:(a,b)=>a.original.quantity.unit.localeCompare(b.original.quantity.unit)||(a.original.quantity.value??0)-(b.original.quantity.value??0),cell:({row:{original:r}})=><div className="work-quantity"><strong>{r.quantity.value===null?'미확인':r.quantity.value.toLocaleString()} <small>{r.quantity.unit}</small></strong><span>{r.quantity.label}</span></div>},
   {id:'needDate',accessorFn:r=>r.needDate.value,header:'필요일',cell:({row:{original:r}})=><div className="work-date"><time dateTime={r.needDate.value}>{r.needDate.label}</time><small>합성 기한</small></div>},
   {id:'review',accessorFn:r=>r.reviewStatus.label,header:'검토 상태',cell:c=><StatusCell value={c.row.original.reviewStatus}/>},
   {id:'material',accessorFn:r=>r.materialStatus.label,header:'자재·이력 상태',cell:c=><StatusCell value={c.row.original.materialStatus}/>},
   {id:'unknowns',accessorFn:r=>r.unknowns.join(' '),header:'미확인',cell:c=><Unknowns items={c.row.original.unknowns} onClick={()=>D(c.row.original)}/>},
   {id:'owner',accessorFn:r=>r.owner.label,header:'담당',cell:c=><span className="work-owner">{c.getValue()}<small>팀 예시</small></span>},
   {id:'next',header:'다음 조치',cell:({row:{original:r}})=><Button onClick={()=>{activate(r);go(r.route)}}>{r.nextLabel}<ArrowUpRight size={12}/></Button>},
   {id:'basis',accessorFn:r=>r.dataBasis.version,header:'데이터 기준',cell:c=><DataBasis version={c.row.original.dataBasis.version} onClick={()=>D(c.row.original)}/>}
  ]}/>
  <div className="list-footnote">서로 다른 단위·의미의 수량은 합산하지 않습니다. 필요일·담당 팀은 기존 합성 예시입니다. 체크는 목록 선택이며 승인·예약을 실행하지 않습니다.</div>
  <Modal open={!!details} onClose={()=>D(null)} title="업무 수량·상태의 기준" description={details?`${details.id} · ${details.title}`:'업무 기준'}>{details&&<><Notice>이 창을 열어도 현재 선택 객체 {selected?.id??selectedId}와 AI 맥락은 바뀌지 않습니다.</Notice><dl className="work-basis-details"><dt>대상 / 구성</dt><dd><code>{details.objectId}</code> · {details.configLabel}</dd><dt>수량 의미</dt><dd>{details.quantity.label}: {details.quantity.value??'미확인'} {details.quantity.unit}<p>{details.quantity.basis}</p></dd><dt>검토 상태</dt><dd>{details.reviewStatus.label}<p>{details.reviewStatus.detail}</p></dd><dt>자재·이력</dt><dd>{details.materialStatus.label}<p>{details.materialStatus.detail}</p></dd><dt>필요일</dt><dd>{details.needDate.value}<p>{details.needDate.basis}</p></dd><dt>담당</dt><dd>{details.owner.label}<p>{details.owner.basis}</p></dd><dt>미확인</dt><dd><ul>{details.unknowns.map(x=><li key={x}>{x}</li>)}</ul></dd><dt>기준·근거</dt><dd><code>{details.dataBasis.asOf}</code> · v{details.dataBasis.version}<p>{details.dataBasis.origin}</p>{details.dataBasis.evidenceRefs.map(x=><code className="basis-reference" key={x}>{x}</code>)}{details.dataBasis.notes.map(x=><p key={x}>{x}</p>)}</dd></dl><Button onClick={()=>D(null)}>목록으로 복귀</Button></>}</Modal>
 </div>;
}

export function ConfigurationTable(){
 const {s,go}=useApp(),{select,selectedId}=useEntity(),[source,S]=useStored('home-config-source','전체'),[active,A]=useStored('home-active-configuration',''),[details,D]=useState<ConfigurationItem|null>(null);
 const all=buildConfigurationItems(s),rows=all.filter(r=>source==='전체'||r.source===source);
 const activate=(r:ConfigurationItem)=>{A(r.id);select(r.contextObjectId,false)};
 return <section className="panel configurations-panel"><div className="panel-heading"><div><h2>제품·구성 비교 <span className="counter">{rows.length}</span></h2><p>모델 7종 · 실제 BOM 5개 + 독립 합성 BOM 3개 · 행 수는 생산 수량이 아닙니다.</p></div><label className="source-filter" data-view-state="true">자료<select aria-label="구성 목록 자료 구분" value={source} onChange={e=>S(e.target.value)}>{['전체','실제 공개 원본','합성 예시','원본 미확보'].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="dense-workspace-table configuration-table" data-work-grid="configurations"><DataTable data={rows} viewStateKey="home-configurations" searchLabel="모델·개정·구성 검색" activeRowId={rows.some(r=>r.id===active&&r.contextObjectId===selectedId)?active:undefined} onActiveRow={activate} pageSizes={[5,15,30]} columns={[
   {id:'photo',header:'보드 사진',enableHiding:false,cell:c=><PhotoCell id={c.row.original.id}/>},
   {id:'object',accessorFn:r=>`${r.modelName} ${r.revision} ${r.configLabel} ${r.id}`,header:'모델 · 개정 / 구성',enableHiding:false,cell:({row:{original:r}})=><div className="work-object"><button className="work-object-name" onClick={()=>{A(r.id);select(r.contextObjectId);go('EXPLORE')}}>{r.modelName}<span className="revision-tag">{r.revision}</span><ArrowUpRight size={12}/></button><span className="work-configuration">{r.configLabel}</span><code>{r.id}</code></div>},
   {id:'quantity',accessorFn:r=>r.bomRows??undefined,header:'BOM 원본 / 행',sortUndefined:'last',cell:c=><div className="work-quantity"><strong>{c.row.original.bomRows===null?'미등록':c.row.original.bomRows}<small>{c.row.original.bomRows===null?'':' 행'}</small></strong><span>{c.row.original.bomRows===null?'전체 원본 미확보':'단일단계 전체 행'}</span></div>},
   {id:'source',accessorFn:r=>r.source,header:'자료 구분',cell:c=><SourceBadge source={c.row.original.source}/>},
   {id:'review',accessorFn:r=>r.reviewStatus.label,header:'검토 상태',cell:c=><StatusCell value={c.row.original.reviewStatus}/>},
   {id:'material',accessorFn:r=>r.materialStatus.label,header:'자재 상태',cell:c=><StatusCell value={c.row.original.materialStatus}/>},
   {id:'unknowns',accessorFn:r=>r.unknowns.join(' '),header:'미확인',cell:c=><Unknowns items={c.row.original.unknowns} onClick={()=>D(c.row.original)}/>},
   {id:'next',header:'다음 조치',cell:({row:{original:r}})=><Button onClick={()=>{activate(r);go('EXPLORE')}}>{r.bomRows===null?'확보 상태 확인':'BOM·관계 탐색'}<ArrowUpRight size={12}/></Button>},
   {id:'basis',accessorFn:r=>r.dataBasis.version,header:'데이터 기준',cell:c=><DataBasis version={c.row.original.dataBasis.version} onClick={()=>D(c.row.original)}/>}
  ]}/><div className="list-footnote">참고 사진 확보와 BOM 원본 확보는 별개입니다. 합성 보드에 실제 생산 수요·필요일·사용자 배정을 추정하지 않습니다.</div></div><Modal open={!!details} onClose={()=>D(null)} title="구성 비교의 범위" description={details?`${details.modelName} · ${details.id}`:'구성 기준'}>{details&&<><dl className="work-basis-details"><dt>원본</dt><dd>{details.source} · {details.bomRows??'미등록'} {details.bomRows===null?'':'행'}</dd><dt>검토</dt><dd>{details.reviewStatus.label}<p>{details.reviewStatus.detail}</p></dd><dt>자재</dt><dd>{details.materialStatus.label}<p>{details.materialStatus.detail}</p></dd><dt>미확인</dt><dd><ul>{details.unknowns.map(x=><li key={x}>{x}</li>)}</ul></dd><dt>기준·근거</dt><dd>{details.dataBasis.asOf} · v{details.dataBasis.version}<p>{details.dataBasis.origin}</p>{details.dataBasis.evidenceRefs.map(x=><code className="basis-reference" key={x}>{x}</code>)}{details.dataBasis.notes.map(x=><p key={x}>{x}</p>)}</dd></dl><Button onClick={()=>D(null)}>목록으로 복귀</Button></>}</Modal></section>;
}
