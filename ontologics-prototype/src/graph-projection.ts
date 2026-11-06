import type {Entity,Relation} from './entity-data';
import {SNAPSHOT_AT} from './entity-data';
import type {State} from './domain';
import {impactMetrics} from './change-impact-model';

/** Local development read-model DTO. Not an agreed production API or authority. */
export const GRAPH_SERVER='http://127.0.0.1:5176';
export type GraphProjectionStatus={mode:'local-mock-projection';sessionId:string;companyId:string;sourceId:string;state:'empty'|'queued'|'ready'|'failed';ledgerVersion:number|null;graphVersion:number|null;receivedSequence:number|null;projectedSequence:number|null;receivedAt:string|null;projectedAt:string|null;error:string|null;simulationDelayMs:number};
/** An unchanged poll must retain the current view, including mounted media. */
export function sameGraphStatus(a:GraphProjectionStatus|null|undefined,b:GraphProjectionStatus){
 return !!a&&(Object.keys(b) as (keyof GraphProjectionStatus)[]).every(key=>a[key]===b[key]);
}
export type GraphProjectionSnapshot={schema:1;companyId:'A';sourceId:string;sequence:number;ledgerVersion:number;asOf:string;publishedAt:string;selectedId:string|null;entities:Entity[];relations:Relation[];metrics:{required:number;reserved:number;receiptPass:number|null;materialAllocated:number;unsecured:number;bomApplied:boolean;demandConfirmed:boolean;unallocatedPass:number|null;unreservedOriginal:number};reviews:{id:string;version:number;hash:string;status:string;author:string;approvedBy?:string;base:number}[]};
export interface GraphProjectionPort {
 create(sourceId:string):Promise<{sessionId:string;producerToken:string;readToken:string}>;
 publish(token:string,snapshot:GraphProjectionSnapshot):Promise<GraphProjectionStatus>;
 status(token:string):Promise<GraphProjectionStatus>;
 revoke(token:string):Promise<void>;
}
async function request<T>(path:string,method:string,token?:string,body?:unknown):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetch(GRAPH_SERVER+'/local-graph/'+path,{method,signal:controller.signal,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.error??'그래프 서버 응답 오류 ('+response.status+')');}
  return response.status===204?undefined as T:await response.json();
 }finally{clearTimeout(timer)}
}
export const localGraphProjectionPort:GraphProjectionPort={
 create:sourceId=>request('sessions','POST',undefined,{companyId:'A',sourceId}),
 publish:(token,snapshot)=>request('projection','PUT',token,snapshot),
 status:token=>request('status','GET',token),
 revoke:token=>request('session','DELETE',token),
};
export function graphProjectionContent(state:State,objects:Entity[],links:Relation[],companyId:string){
 if(companyId!=='A')throw Error('이 회사에는 게시할 로컬 예시가 없습니다.');
 const metrics=impactMetrics(state),entities=objects.filter(e=>e.company===companyId),ids=new Set(entities.map(e=>e.id));
 return {schema:1 as const,companyId:'A' as const,ledgerVersion:state.version,asOf:SNAPSHOT_AT,entities,
  relations:links.filter(r=>ids.has(r.from)&&ids.has(r.to)),
  metrics:{required:metrics.required,reserved:state.reserved,receiptPass:metrics.receiptPass,materialAllocated:state.materialAllocated,unsecured:metrics.unsecured,bomApplied:state.bomApplied,demandConfirmed:state.demandConfirmed,unallocatedPass:metrics.unallocatedPass,unreservedOriginal:metrics.unreservedOriginal},
  reviews:state.drafts.filter(d=>(d.companyId??'A')===companyId).map(d=>({id:d.id,version:d.version,hash:d.hash,status:d.status,author:d.author,approvedBy:d.approvedBy,base:d.base}))};
}
