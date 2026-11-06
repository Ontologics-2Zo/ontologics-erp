import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowDownToLine,Search} from 'lucide-react';
import {useEntity,EntityChip,TraceGraph} from './entity';
import {relations,type Entity,type Relation} from './entity-data';
import type {QueryMeta} from './ports';
import {Badge,Button,Notice,Panel,useStored} from './ui';
import {OntologyObjectTable} from './ontology-tables';
import {BomRegistrationOverview} from './bom-registration-changes';

/** Export is an induced subgraph: a filtered file never contains dangling endpoints. */
export function aboxExport(objects:Entity[],edges:Relation[]){
 const ids=new Set(objects.map(object=>object.id));
 return {objects,relations:edges.filter(edge=>ids.has(edge.from)&&ids.has(edge.to))};
}
function download(value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ontologics-authorized-fixture.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function ABoxBrowser({children}:{children:ReactNode}){
 const ctx=useEntity();
 const key=[ctx.company,ctx.portContext.actor,ctx.portContext.identityRevision,ctx.portContext.dataVersion].join(':');
 return <ABoxQuery key={key}>{children}</ABoxQuery>;
}
function ABoxQuery({children}:{children:ReactNode}){
 const ctx=useEntity(),fixed=useRef(ctx.portContext),alive=useRef(true),generation=useRef(0);
 const [search,Q]=useStored('workflow-view-ontology-search',''),[limit,L]=useStored('workflow-view-ontology-limit',12);
 const [type,T]=useStored('workflow-view-abox-type','전체'),[source,S]=useStored('workflow-view-abox-source','전체');
 const [result,R]=useState<{objects:Entity[];meta:QueryMeta;page:number}|null>(null),[error,E]=useState(''),[busy,B]=useState(false),[retry,Retry]=useState(0);
 const [mode,M]=useState<Relation['type']>('design');
 const query=search.trim()||(type==='전체'?'':type);
 const fetchPage=async(page:number,previous:Entity[],ticket:number)=>{B(true);E('');try{
  const response=await ctx.ports.query.search(query,fixed.current,{page,pageSize:100});
  if(!alive.current||ticket!==generation.current)return;
  if(response.meta.state==='failed')throw Error('객체 조회 실패');
  R({objects:[...new Map([...previous,...response.data.filter(object=>object.company===ctx.company)].map(object=>[object.id,object])).values()],meta:response.meta,page});
 }catch(cause){if(alive.current&&ticket===generation.current)E(cause instanceof Error?cause.message:String(cause))}finally{if(alive.current&&ticket===generation.current)B(false)}};
 useEffect(()=>{alive.current=true;const ticket=++generation.current;R(null);void fetchPage(0,[],ticket);return()=>{alive.current=false}},[query,retry]);
 const objects=result?.objects??[],visible=objects.filter(object=>(type==='전체'||object.type===type)&&(source==='전체'||object.source===source));
 const complete=!!result&&result.meta.state==='ready'&&result.meta.exact&&result.meta.total!==null&&objects.length>=result.meta.total;
 // The Mock relation catalogue is filtered through the same current resolver; no global company counts leak.
 const allowed=ctx.relations.filter(edge=>ctx.resolve(edge.from)&&ctx.resolve(edge.to));
 const selected=ctx.selected;
 useEffect(()=>{if(selected?.type==='BOM 등록 반영'||selected?.type==='원본 문서')M('flow')},[selected?.id]);
 return <>
  <div className="ext-statline"><div><small>전체 고유 업무 객체</small><strong>미집계</strong><span>구축 목표 100,000+</span></div><div><small>현재 QueryPort 검색 결과</small><strong>{result?.meta.total??'미집계'}<em>개</em></strong><span>회사 {ctx.company} · {result?.meta.exact?'정확':'미확인'} 집계</span></div><div><small>로드 / 유형·자료 일치</small><strong>{objects.length} / {visible.length}</strong><span>{complete?'조회 범위 전체':'부분 로드 · 전체 0으로 해석하지 않음'}</span></div><div><small>현재 업무 버전</small><strong>v{ctx.portContext.dataVersion}</strong><span>{result?.meta.asOf??'조회 대기'} · Mock</span></div></div>
  <Notice><strong>ABox · 개별 업무 객체</strong> — 실제 BOM 원문과 합성 재고·생산·납품 사건을 구분합니다. 클래스 정의를 클릭하는 TBox와 달리, 아래 객체 선택은 같은 ID의 속성·근거·관계·업무 AI로 연결됩니다. 운영 RDF 추론은 미연결입니다.</Notice>
  {children}
  <BomRegistrationOverview/>
  <Panel title="권한 범위의 객체 목록" subtitle="100개씩 조회하고 표를 점진 확장합니다. 새 보드와 현재 수량도 공통 QueryPort에서 읽습니다." action={<Button disabled={!result||!!error} onClick={()=>download({company:ctx.company,asOf:result?.meta.asOf,dataVersion:result?.meta.dataVersion,origin:'local-mock-query',query,filters:{type,source},complete,queryTotal:result?.meta.total,loaded:objects.length,...aboxExport(visible,allowed)})}><ArrowDownToLine size={14}/>조회 결과 다운로드</Button>}>
   <div className="ext-filter" data-view-state="true"><label><Search size={15}/><input aria-label="전체 지도 객체 검색" placeholder="이름 · ID · 유형 검색" value={search} onChange={event=>{Q(event.target.value);L(12)}}/></label><select aria-label="ABox 객체 유형" value={type} onChange={event=>{T(event.target.value);L(12)}}>{['전체','제품 모델','제품 구성','BOM 원문 품목','사내 품목','부품 로트','예약','생산작업','개별 보드','장착 사건','계약','납품회차','출하','클레임','BOM 등록 반영','원본 문서'].map(label=><option key={label}>{label}</option>)}</select><select aria-label="ABox 자료 구분" value={source} onChange={event=>{S(event.target.value);L(12)}}>{['전체','실제 공개 원본','합성 예시'].map(label=><option key={label}>{label}</option>)}</select><span>검색 {result?.meta.total??'미집계'} · 로드 {objects.length} · 확장 대상 {Math.min(limit,visible.length)}</span></div>
   {busy&&<div role="status">업무 객체 조회 중…</div>}{error&&<Notice tone="warning">조회 실패 · {error} <Button onClick={()=>Retry(value=>value+1)}>같은 조건으로 재조회</Button></Notice>}
   {result?.meta.state==='stale'&&<Notice tone="warning">오래된 기준 · 현재 표시 버전을 확인하세요.</Notice>}
   {result&&<OntologyObjectTable rows={visible.slice(0,limit)} relations={allowed}/>}
   <div className="ext-actions">{limit<visible.length&&<Button onClick={()=>L(limit+12)}>다음 12개 펼치기</Button>}{result&&!complete&&<Button disabled={busy||!!error} onClick={()=>fetchPage(result.page+1,objects,generation.current)}>다음 검색 결과 100개 조회</Button>}</div>
   {result&&!complete&&<Notice>현재 로드한 범위만 필터·다운로드합니다. 전체 결과는 다음 페이지를 조회해 확인하며 영향 조사 완료로 처리하지 않습니다.</Notice>}
  </Panel>
  {selected&&<details className="bom-review-original" open><summary>선택 객체의 ABox 내용 · {selected.id}</summary><div className="inset"><div className="badge-row"><EntityChip id={selected.id}/><Badge>{selected.source}</Badge><Badge>{selected.status}</Badge></div><dl className="details">{Object.entries(selected.properties).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl><div className="toolbar">{(['design','mount','flow','substitution','reservation'] as const).map((item,index)=><Button key={item} primary={mode===item} onClick={()=>M(item)}>{['설계 BOM','장착 사건','업무 연결','대체 적용','예약'][index]}</Button>)}</div><TraceGraph rootId={selected.id} mode={mode}/></div></details>}
  <Notice>그래프는 선택 객체 주변만 표시합니다. 상세 300노드 / 800관계, 누적 1,000노드 / 2,500관계 가드레일은 유지하며 10만 객체 부하 검증 완료를 의미하지 않습니다.</Notice>
 </>;
}
