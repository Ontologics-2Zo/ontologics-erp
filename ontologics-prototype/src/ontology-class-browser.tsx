import {useEffect,useId,useRef,useState} from 'react';
import {ArrowDown,ArrowRight,Box,ChevronDown,FileCode2,GitBranch,Layers,Network,RefreshCw,Search,Table2} from 'lucide-react';
import {useEntity} from './entity';
import {useApp} from './context';
import type {Entity} from './entity-data';
import type {QueryMeta} from './ports';
import {initialClasses,classLinks,classEntityTypes,type ClassNode,type ClassLink} from './ontology-definitions';
import {Badge,Button,Notice,useStored} from './ui';
import {WorkflowTable,WorkflowPhoto,WorkflowObject} from './workflow-tables';
import './ontology-class-browser.css';

const groups=[...new Set(initialClasses.map(node=>node.domain))];
const relationKey=(link:ClassLink)=>[link.from,link.to,link.name].join(':');
const codeName=(name:string)=>name.split(' / ')[0];
const relationNote=(name:string)=>name.split(' / ').slice(1).join(' / ');
const className=(id:string)=>initialClasses.find(node=>node.id===id)?.label??id;
const positions:Record<string,{x:number;y:number}>={ProductConfiguration:{x:25,y:25},Part:{x:355,y:25},PartLot:{x:355,y:185},BoardUnit:{x:25,y:185},Shipment:{x:25,y:345},DeliveryRound:{x:355,y:345}};

export function OntologyClassBrowser(){
 const ctx=useEntity();
 const [selected,Select]=useStored('workflow-view-class-definition','ProductConfiguration'),[search,SearchClass]=useStored('workflow-view-class-search',''),[view,View]=useStored('workflow-view-class-mode','graph'),[near,Near]=useStored('workflow-view-class-neighbors',false);
 const selectedClass=initialClasses.find(node=>node.id===selected)??initialClasses[0];
 const found=initialClasses.filter(node=>(node.label+' '+node.id+' '+node.domain).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const related=classLinks.filter(link=>link.from===selectedClass.id||link.to===selectedClass.id);
 const shownLinks=near?related:classLinks,shownIds=new Set(near?[selectedClass.id,...shownLinks.flatMap(link=>[link.from,link.to])]:initialClasses.map(node=>node.id));
 const showObjects=()=>document.getElementById('class-linked-objects')?.scrollIntoView({block:'start',behavior:'smooth'});
 return <section className="class-browser" aria-label="읽기 전용 클래스·관계 탐색">
  <div className="class-browser-summary"><div><Badge tone="blue">읽기 전용</Badge><strong>기본 정의 v1</strong><span>{initialClasses.length}개 클래스 · {classLinks.length}개 관계 정의</span><Badge>업무 AI 대상 유지</Badge></div><small>기존 로컬 정의 예시 · 운영 RDF/OWL 미연결</small></div>
  <div className="class-browser-layout">
   <aside className="class-browser-palette" aria-label="도메인별 클래스 목록"><div className="class-panel-heading"><h2><Layers size={16}/>클래스 목록</h2><small>업무 영역별 묶음 · 상속 아님</small></div><label className="class-search"><Search size={15}/><input type="search" aria-label="클래스 이름·ID 검색" placeholder="이름 · ID 검색" value={search} onChange={event=>SearchClass(event.target.value)}/></label><div className="class-domain-groups">{groups.map(group=>{const nodes=found.filter(node=>node.domain===group);return nodes.length?<div className="class-domain" key={group}><h3><ChevronDown size={12}/>{group}<span>{nodes.length}</span></h3>{nodes.map(node=><button key={node.id} className={selectedClass.id===node.id?'selected':''} aria-pressed={selectedClass.id===node.id} onClick={()=>Select(node.id)}><Box size={15}/><span>{node.label}<code title={node.id}>{node.id}</code></span></button>)}</div>:null})}{!found.length&&<p className="class-empty">조건에 맞는 클래스가 없습니다.</p>}</div><div className="class-palette-note"><FileCode2 size={14}/><span>관리자 초안은 별도로 유지됩니다. 초안 저장만으로 이 기준 정의를 바꾸지 않습니다.</span></div></aside>
   <section className="class-browser-map"><div className="class-panel-heading"><div><h2><Network size={16}/>클래스 관계도</h2><small>정의 연결 · 개별 객체의 실제 사건 아님</small></div><div className="class-view-switch" data-view-state="true"><button aria-pressed={view==='graph'} className={view==='graph'?'active':''} onClick={()=>View('graph')}><Network size={13}/>관계도</button><button aria-pressed={view==='list'} className={view==='list'?'active':''} onClick={()=>View('list')}><Table2 size={13}/>관계 목록</button></div></div><div className="class-map-toolbar" data-view-state="true"><label><input type="checkbox" checked={near} onChange={event=>Near(event.target.checked)}/>선택 주변만</label><span>표시 {shownIds.size}클래스 / {shownLinks.length}관계</span></div>
    {view==='graph'?<ClassDefinitionGraph selected={selectedClass.id} nodes={initialClasses.filter(node=>shownIds.has(node.id))} links={shownLinks} onSelect={Select}/>:<div className="class-relation-list">{shownLinks.map(link=><div key={relationKey(link)}><div><button onClick={()=>Select(link.from)}>{className(link.from)}</button><ArrowRight size={14}/><button onClick={()=>Select(link.to)}>{className(link.to)}</button></div><code>{codeName(link.name)}</code><small>{relationNote(link.name)} · 기존 정의 방향</small></div>)}</div>}
    <div className="class-map-legend"><span><i/>관계 정의 →</span><span>상속 정의 없음</span><span>제약 설명은 상세에서 확인</span></div>
   </section>
   <aside className="class-browser-inspector" aria-label="선택 클래스 정의"><div className="class-inspector-title"><span>선택한 클래스</span><h2><Box size={19}/>{selectedClass.label}</h2><code>{selectedClass.id}</code><p>{selectedClass.domain} 영역 · 기본 정의 v1</p></div><div className="class-inspector-body"><h3>속성 이름 <Badge>{selectedClass.properties.length}개</Badge></h3><ul className="class-properties">{selectedClass.properties.map(property=><li key={property}><code>{property}</code><small>자료형·필수 여부의 구조화 정의 미연결</small></li>)}</ul><h3>기존 제약 설명</h3><p className="class-constraint">{selectedClass.constraint}</p><small className="class-definition-limit">자연어 초안입니다. 실행 가능한 SHACL·검증 결과는 미연결입니다.</small><h3>선택 클래스의 관계 <Badge>{related.length}개</Badge></h3><div className="class-inspector-links">{related.map(link=><button key={relationKey(link)} onClick={()=>Select(link.from===selectedClass.id?link.to:link.from)}><span>{link.from===selectedClass.id?'나가는 관계 →':'들어오는 관계 ←'}</span><strong>{className(link.from===selectedClass.id?link.to:link.from)}</strong><code>{codeName(link.name)}</code></button>)}</div><Button primary onClick={showObjects}>해당 유형 객체 보기 <ArrowDown size={14}/></Button></div></aside>
  </div>
  <div className="class-context-note"><GitBranch size={15}/><span>클래스 선택은 정의 탐색입니다. 현재 업무 객체 <code>{ctx.selectedId||'선택 없음'}</code>와 AI 맥락은 유지합니다. 아래 객체를 선택하면 해당 업무 대상으로 전환합니다.</span></div>
  <ClassLinkedObjects key={[selectedClass.id,ctx.company,ctx.portContext.actor,ctx.portContext.identityRevision,ctx.portContext.dataVersion,ctx.portContext.asOf??''].join(':')} definition={selectedClass}/>
 </section>;
}

function ClassDefinitionGraph({selected,nodes,links,onSelect}:{selected:string;nodes:ClassNode[];links:ClassLink[];onSelect:(id:string)=>void}){
 const marker=useId().replace(/:/g,'');
 return <div className="class-map-scroll"><svg viewBox="0 0 600 465" role="group" aria-label="읽기 전용 클래스 관계도"><defs><pattern id={marker+'grid'} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="var(--border)"/></pattern><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="var(--link)"/></marker></defs><rect width="600" height="465" fill={`url(#${marker}grid)`}/>{links.map(link=>{const a=positions[link.from],b=positions[link.to],horizontal=a.y===b.y,forward=b.x>a.x;const x1=horizontal?a.x+(forward?210:0):a.x+105,y1=horizontal?a.y+43:a.y+86,x2=horizontal?b.x+(forward?0:210):b.x+105,y2=horizontal?b.y+43:b.y;const x=(x1+x2)/2,y=(y1+y2)/2,active=link.from===selected||link.to===selected;return <g className={'class-definition-edge '+(active?'active':'')} key={relationKey(link)}><path d={`M${x1},${y1}L${x2},${y2}`} markerEnd={`url(#${marker})`}/><rect x={horizontal?x-57:x-70} y={horizontal?y-38:y-20} width={horizontal?114:140} height="33" rx="4"/><text x={x} y={horizontal?y-24:y-6} textAnchor="middle">{codeName(link.name)}</text><text x={x} y={horizontal?y-10:y+8} className="class-edge-note" textAnchor="middle">{relationNote(link.name)}</text><title>{link.from} → {link.name} → {link.to}</title></g>})}{nodes.map(node=><g key={node.id} className={'class-definition-node '+(selected===node.id?'selected':'')} role="button" tabIndex={0} aria-label={`${node.label} 클래스 보기`} aria-pressed={selected===node.id} transform={`translate(${positions[node.id].x},${positions[node.id].y})`} onClick={()=>onSelect(node.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(node.id)}}}><rect width="210" height="86" rx="7"/><text x="14" y="21" className="class-node-domain">{node.domain} · 클래스</text><text x="14" y="45" className="class-node-title">{node.label}</text><text x="14" y="66" className="class-node-id">{node.id}</text><circle cx="193" cy="18" r="4"/></g>)}</svg></div>;
}

type Loaded={objects:Entity[];meta:QueryMeta;scanned:number;page:number;complete:boolean};
function ClassLinkedObjects({definition}:{definition:ClassNode}){
 const ctx=useEntity(),{go,evidence}=useApp(),type=classEntityTypes[definition.id];
 const [result,Result]=useState<Loaded|null>(null),[error,ErrorText]=useState(''),[busy,Busy]=useState(false),[retry,Retry]=useState(0);const alive=useRef(true),pending=useRef(false);
 const fixed=useRef(structuredClone(ctx.portContext));
 const fetchPage=async(page:number,previous:Loaded|null)=>{if(pending.current||!type)return;pending.current=true;Busy(true);ErrorText('');try{const response=await ctx.ports.query.search(type,fixed.current,{page,pageSize:100});if(!alive.current)return;if(response.meta.state==='failed')throw Error('유형 조회 실패');const scanned=(previous?.scanned??0)+response.data.length,objects=[...(previous?.objects??[]),...response.data.filter(entity=>entity.company===fixed.current.companyId&&entity.type===type)];const complete=response.meta.state==='ready'&&response.meta.exact&&response.meta.total!==null&&scanned>=response.meta.total;Result({objects:[...new Map(objects.map(entity=>[entity.id,entity])).values()],meta:response.meta,scanned,page,complete});}catch(error){if(alive.current)ErrorText(error instanceof Error?error.message:String(error))}finally{pending.current=false;if(alive.current)Busy(false)}};
 useEffect(()=>{alive.current=true;void fetchPage(0,null);return()=>{alive.current=false}},[retry]);
 return <section id="class-linked-objects" className="class-linked-objects" aria-label="선택 클래스와 연결한 업무 객체"><div className="class-panel-heading"><div><h2><Box size={16}/>{definition.label} · 업무 객체 목록</h2><p>현재 객체의 유형 <code>{type??'매핑 미연결'}</code>과 정확히 일치하는 목록입니다. RDF 클래스 소속·추론 결과는 아닙니다.</p></div><Badge>회사 {ctx.company}</Badge></div>
  {!type?<Notice>이 정의의 업무 객체 유형 연결은 미등록입니다.</Notice>:<>
   {busy&&!result&&<div role="status" className="class-query-state">허용된 유형 객체 조회 중…</div>}
   {error&&<div className="class-query-state" role="alert"><strong>객체 조회 실패 · {error}</strong><Button onClick={()=>Retry(value=>value+1)}><RefreshCw size={14}/>같은 조건으로 재조회</Button></div>}
   {result&&<><div className="class-object-count"><span>유형 일치 {result.objects.length}개{result.complete?' · 조회 범위 내 정확 집계':' · 현재 로드 범위'}</span><span>원 검색 {result.meta.total??'미집계'}개 · 로드 {result.scanned}개 · {result.complete?'전체 결과':'부분 결과'} · {result.meta.state==='stale'?'오래된 기준 · ':''}v{result.meta.dataVersion}</span></div><WorkflowTable<Entity> key={definition.id} tableKey={`class-objects-${definition.id}`} data={result.objects} getRowId={entity=>entity.id} contextId={entity=>entity.id} searchLabel="연결한 객체의 이름·ID·상태 검색" empty={result.objects.length?'검색 조건에 맞는 객체가 없습니다.':result.complete?'현재 회사·조회 범위에 이 유형의 객체가 없습니다.':'현재 로드 범위에는 유형 일치 객체가 없습니다. 전체 0개를 의미하지 않습니다.'} columns={[
    {id:'photo',header:'사진',enableHiding:false,cell:cell=>['제품 구성','사내 품목','부품 로트','개별 보드'].includes(cell.row.original.type)?<WorkflowPhoto id={cell.row.original.id}/>:<span className="muted">사진 대상 아님</span>},
    {id:'object',header:'업무 객체 · ID',enableHiding:false,accessorFn:entity=>entity.name+' '+entity.id,cell:cell=><WorkflowObject id={cell.row.original.id} detail={cell.row.original.id}/>},
    {id:'status',header:'상태 · 자료',accessorFn:entity=>entity.status+' '+entity.source,cell:cell=><div className="workflow-cell"><Badge>{cell.row.original.status}</Badge><small>{cell.row.original.source}</small></div>},
    {id:'evidence',header:'원문 근거',accessorFn:entity=>entity.evidence.join(' '),cell:cell=><div className="workflow-cell">{cell.row.original.evidence.length?cell.row.original.evidence.map(id=><button key={id} className="text-btn" onClick={()=>evidence(id)}>{id}</button>):'근거 미등록'}</div>},
    {id:'next',header:'다음 탐색',cell:cell=><Button onClick={()=>{ctx.select(cell.row.original.id,false);go('EXPLORE')}}>객체·관계 열기 <ArrowRight size={13}/></Button>},
    {id:'basis',header:'개정 · 조회 기준',accessorKey:'revision',cell:cell=><span className="workflow-basis"><span>개정/버전 {cell.row.original.revision}</span><small>{result.meta.asOf.replace('T',' ').replace('+09:00',' KST')}</small><small>{result.meta.mode==='mock'?'로컬 Mock':'서버 조회'} · 데이터 v{result.meta.dataVersion}</small></span>},
   ]} footer="클래스 정의를 바꾸거나 객체를 새로 생성하지 않습니다. 사진은 확대·출처, 객체 이름은 상세, 행 선택은 업무 AI 맥락을 공유합니다."/>{!result.complete&&<div className="class-more"><Button disabled={busy} onClick={()=>fetchPage(result.page+1,result)}>{busy?'조회 중…':'다음 검색 결과 100개 조회'}</Button><small>표시된 유형 일치 수를 전체 집계로 해석하지 않습니다.</small></div>}</>}
  </>}
 </section>;
}
