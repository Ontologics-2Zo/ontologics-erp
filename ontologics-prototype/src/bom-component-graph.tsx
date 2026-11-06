import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight,Expand,FileText,Network,Search} from 'lucide-react';
import {useEntity} from './entity';
import {snapshots,type BomLine,type Entity,type Relation} from './entity-data';
import {EntityThumbnail} from './media';
import {Badge,Button,Modal,Notice,useStored} from './ui';
import type {QueryResult} from './ports';
import {actualBoms,type ActualBomKey} from './actual-boms';
import './bom-component-graph.css';

type Graph=QueryResult<Entity>&{relations:Relation[];relationTotal:number;complete:boolean};
type ComponentRow={entity:Entity;line:BomLine;relation:Relation;packageName:string};
type Props={revision:ActualBomKey;graph:Graph;onCheck:(id:string)=>void};
const PAGE_SIZE=6;

/** Photographic node cards depict source BOM relationships, never physical board coordinates. */
export function BomComponentGraph({revision,graph,onCheck}:Props){
 const ctx=useEntity(),root=actualBoms[revision].configurationId;
 const [open,O]=useState(false),[search,Q]=useStored(`workflow-view-bom-components-${revision}-search`,''),[packageName,P]=useStored(`workflow-view-bom-components-${revision}-package`,'전체'),[page,S]=useStored(`workflow-view-bom-components-${revision}-page`,0),[order,Order]=useStored(`workflow-view-bom-components-${revision}-order`,'참조 기호 분산');
 const configuration=graph.data.find(entity=>entity.id===root);
 const rows=useMemo(()=>{
  const source=actualBoms[revision].lines,lines=snapshots.find(snapshot=>snapshot.id===root)?.lines??[];
  return lines.flatMap(line=>{
   const relation=graph.relations.find(edge=>edge.type==='design'&&edge.from===root&&edge.to===line.partId);
   const entity=graph.data.find(item=>item.id===line.partId);
   if(!relation||!entity)return [];
   const raw=source.find(item=>item.row===line.sourceRow);
   return [{entity,line,relation,packageName:raw?.cells[2]||'미기재'}];
  });
 },[revision,graph,root]);
 // Display-only round-robin of literal reference prefixes; no component merge or inferred type.
 const ordered=useMemo(()=>{if(order==='원문 행 순')return rows;const groups=new Map<string,ComponentRow[]>();for(const row of rows){const prefix=/^[A-Za-z_-]+/.exec(row.line.position)?.[0]??row.line.position;groups.set(prefix,[...(groups.get(prefix)??[]),row])}const result:ComponentRow[]=[];for(let index=0;result.length<rows.length;index++)for(const group of groups.values())if(group[index])result.push(group[index]);return result},[rows,order]);
 const packages=[...new Set(rows.map(row=>row.packageName))].sort((a,b)=>a.localeCompare(b));
 const filtered=ordered.filter(row=>(packageName==='전체'||row.packageName===packageName)&&`${row.entity.name} ${row.entity.id} ${row.line.position} ${row.packageName} ${row.line.sourceRow}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)),safePage=Math.min(Math.max(0,page),pages-1),shown=filtered.slice(safePage*PAGE_SIZE,(safePage+1)*PAGE_SIZE);
 useEffect(()=>{if(page!==safePage)S(safePage)},[safePage,page]);
 useEffect(()=>O(false),[revision,ctx.company,ctx.portContext.identityRevision]);
 const revealSelected=()=>{const index=ordered.findIndex(row=>row.entity.id===ctx.selectedId);Q('');P('전체');S(index>=0?Math.floor(index/PAGE_SIZE):0)};
 const scopeTotal=snapshots.find(snapshot=>snapshot.id===root)?.lines.length;
 return <>
  <div className="bom-components-entry"><div><Network size={15}/><span><strong>보드에 쓰이는 부품의 형태와 사용 위치</strong><small>사진이 있는 설계 관계도 · 6개씩 탐색</small></span></div><Button onClick={()=>O(true)} data-focus-key={`bom-components-${revision}-open`}><Expand size={14}/>부품 구성도</Button></div>
  <Modal open={open} onClose={()=>O(false)} title="BOM 부품 구성도" description={`${actualBoms[revision].modelName} / ${actualBoms[revision].revision} 구성의 원본 기반 설계 BOM 관계입니다. 실물 좌표·실제 장착 이력은 미확인입니다.`}>
   <section className="bom-components" aria-label="사진과 사용 위치를 연결한 BOM 구성도">
    <div className="bom-components-toolbar" data-view-state="true"><label className="bom-components-search"><Search size={15}/><input type="search" aria-label="구성도 품목·참조 위치 검색" placeholder="품목 · U2/R50 · 원문 행 검색" value={search} onChange={event=>{Q(event.target.value);S(0)}}/></label><label>패키지<select aria-label="구성도 패키지 필터" value={packageName} onChange={event=>{P(event.target.value);S(0)}}><option>전체</option>{packages.map(value=><option key={value}>{value}</option>)}</select></label><label>배치<select aria-label="구성도 표시 순서" value={order} onChange={event=>{Order(event.target.value);S(0)}}><option>참조 기호 분산</option><option>원문 행 순</option></select></label><Button onClick={revealSelected}>선택 품목 찾기</Button></div>
    <div className="bom-components-count"><span>원문 전체 <strong>{scopeTotal??'미집계'}행</strong> · 관계로 로드 <strong>{rows.length}품목</strong> · 검색 <strong>{filtered.length}품목</strong> · 표시 <strong>{shown.length}품목 / {shown.length}관계</strong></span><span>{graph.complete?'현재 조회 범위 전체':'부분 결과 · 미로드 대상 존재'} · v{graph.meta.dataVersion}</span></div>
    {configuration?<ComponentDiagram configuration={configuration} rows={shown} onCheck={onCheck} onDetails={id=>{O(false);ctx.select(id)}}/>:<Notice tone="warning">현재 회사 범위의 구성 객체를 확인하지 못했습니다.</Notice>}
    {!shown.length&&<div className="bom-components-empty" role="status">조건에 맞는 구성도 품목이 없습니다. 검색·패키지 조건을 바꿔보세요.</div>}
    <div className="bom-components-pagination" data-view-state="true"><span>현재 선택 <code>{ctx.selectedId}</code><small>사진은 확대·출처, 이름은 객체 선택 · 같은 업무 AI 맥락 공유</small></span><div><Button aria-label="구성도 이전 페이지" disabled={safePage===0} onClick={()=>S(safePage-1)}><ChevronLeft size={14}/>이전</Button><strong>{safePage+1} / {pages}</strong><Button aria-label="구성도 다음 페이지" disabled={safePage+1>=pages} onClick={()=>S(safePage+1)}>다음<ChevronRight size={14}/></Button></div></div>
    <p className="bom-components-disclaimer">참조 기호 분산은 표시 순서만 바꾸며 분류·장착 순서가 아닙니다. 한 카드는 하나의 원문 BOM 행이며 복수 참조 위치를 보존합니다. 같은 패키지나 사진이 같은 품목·호환성을 뜻하지 않습니다. NA·NS·Opened·Closed를 포함한 전체 원문 행의 실장 여부·양수 단위는 미검수 상태로 유지합니다. 선은 설계 사용 관계이며 부품 배치·실제 장착 증거가 아닙니다.</p>
   </section>
  </Modal>
 </>;
}

function ComponentDiagram({configuration,rows,onCheck,onDetails}:{configuration:Entity;rows:ComponentRow[];onCheck:(id:string)=>void;onDetails:(id:string)=>void}){
 const ctx=useEntity(),container=useRef<HTMLDivElement>(null),root=useRef<HTMLDivElement>(null),cards=useRef(new Map<string,HTMLElement>()),[paths,Paths]=useState<{id:string;d:string}[]>([]),marker=useId().replace(/:/g,'');
 const key=rows.map(row=>row.relation.id).join('|');
 useLayoutEffect(()=>{
  const measure=()=>{const frame=container.current?.getBoundingClientRect(),parent=root.current?.getBoundingClientRect();if(!frame||!parent)return;const x=parent.left-frame.left+parent.width/2,y=parent.bottom-frame.top;
   const next=rows.flatMap((row,index)=>{const child=cards.current.get(row.entity.id)?.getBoundingClientRect();if(!child)return [];const endX=(index%2===0?child.right:child.left)-frame.left,endY=child.top-frame.top+child.height/2;return [{id:row.relation.id,d:`M ${x} ${y} V ${endY} H ${endX}`}];});
   Paths(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
  };
  measure();const observer=new ResizeObserver(measure);if(container.current)observer.observe(container.current);if(root.current)observer.observe(root.current);for(const child of cards.current.values())observer.observe(child);return()=>observer.disconnect();
 },[key]);
 return <div className="bom-components-scroll" tabIndex={0} aria-label="부품 구성도 · 좁은 화면에서는 가로 이동"><div className="bom-components-stage" ref={container}>
  <svg className="bom-components-lines" aria-hidden="true"><defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7Z" fill="var(--graph-line)"/></marker></defs>{paths.map(path=><path key={path.id} d={path.d} markerEnd={`url(#${marker})`}/>)}</svg>
  <div className="bom-components-root" ref={root}><EntityThumbnail entity={configuration} size="small" interactive/><button onClick={()=>ctx.select(configuration.id,false)} aria-label={`${configuration.id} 구성 객체 선택`}><small>설계 BOM의 기준 구성</small><strong>{configuration.name}</strong><code>{configuration.id}</code></button></div>
  <div className="bom-components-nodes">{rows.map(row=><article key={row.entity.id} ref={element=>{if(element)cards.current.set(row.entity.id,element);else cards.current.delete(row.entity.id)}} className={'bom-component-node '+(ctx.selectedId===row.entity.id?'selected':'')} data-component-id={row.entity.id}>
   <div className="bom-component-relation"><ArrowRight size={12}/><span>{row.relation.label} · <strong>{row.line.position}</strong></span><Badge tone={row.entity.status.includes('미확인')?'amber':'blue'}>{row.entity.status}</Badge></div>
   <div className="bom-component-content"><EntityThumbnail entity={row.entity} size="medium" interactive/><button className="bom-component-select" aria-label={`${row.entity.id} 객체 선택`} aria-pressed={ctx.selectedId===row.entity.id} onClick={()=>ctx.select(row.entity.id,false)}><strong>{row.entity.name}</strong><span>패키지 <b>{row.packageName}</b></span><span>원문 수량 <b>{row.line.qty??'미확인'} {row.line.unit==='미확인'?'단위 미확인':row.line.unit}</b></span><code>{row.entity.id}</code></button></div>
   <div className="bom-component-actions"><button className="text-btn" onClick={()=>onCheck(row.entity.id)} data-focus-key={`component-check-${row.entity.id}`}><FileText size={12}/>정합성 근거 · {row.line.sourceRow}행</button><button className="text-btn" onClick={()=>onDetails(row.entity.id)}>상세·관계 <ArrowRight size={12}/></button></div>
  </article>)}</div>
 </div></div>;
}
