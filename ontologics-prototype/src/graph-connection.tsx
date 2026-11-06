import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {ExternalLink,Network,RefreshCw,Unplug} from 'lucide-react';
import {Button} from './ui';
import type {State} from './domain';
import type {Entity,Relation} from './entity-data';
import {GRAPH_SERVER,graphProjectionContent,sameGraphStatus,localGraphProjectionPort as port,type GraphProjectionSnapshot,type GraphProjectionStatus} from './graph-projection';
import './graph-connection.css';

type Session={sessionId:string;producerToken:string;readToken:string;sourceId:string};
type Options={state:State;objects:Entity[];relations:Relation[];companyId:string;identityKey:string;disabled:boolean;selectedId:string;onSelect:(id:string)=>void};
export function useGraphConnection(options:Options){
 const latest=useRef(options);latest.current=options;
 const [session,S]=useState<Session|null>(null),[status,SS]=useState<GraphProjectionStatus|null>(null),[connecting,C]=useState(false),[error,E]=useState(''),[networkError,NE]=useState('');
 const sessionRef=useRef<Session|null>(null),epoch=useRef(0),sequence=useRef(0),lastContent=useRef(''),pending=useRef<GraphProjectionSnapshot|null>(null),graphWindow=useRef<Window|null>(null),connectLock=useRef(false);
 const accept=(next:GraphProjectionStatus)=>SS(old=>{
  if(sameGraphStatus(old,next))return old;
  return !old||(next.receivedSequence??0)>(old.receivedSequence??0)||((next.receivedSequence??0)===(old.receivedSequence??0)&&(next.projectedSequence??0)>=(old.projectedSequence??0))?next:old;
 });
 const disconnect=()=>{
  const previous=sessionRef.current;epoch.current++;sessionRef.current=null;connectLock.current=false;S(null);SS(null);C(false);E('');NE('');pending.current=null;lastContent.current='';
  if(previous){graphWindow.current?.postMessage({type:'ontologics.graph.revoke',sessionId:previous.sessionId},GRAPH_SERVER);void port.revoke(previous.producerToken).catch(()=>{/* Server sessions also expire; revoked view hides immediately. */});}
 };
 useEffect(()=>{disconnect();return disconnect},[options.identityKey,options.disabled]);
 const connect=async()=>{
  if(connectLock.current||sessionRef.current||latest.current.disabled||latest.current.companyId!=='A')return;
  connectLock.current=true;C(true);E('');NE('');const currentEpoch=++epoch.current,sourceId=crypto.randomUUID();
  try{const created=await port.create(sourceId);if(epoch.current!==currentEpoch){void port.revoke(created.producerToken).catch(()=>{});return;}
   const next={...created,sourceId};sessionRef.current=next;sequence.current=0;lastContent.current='';S(next);
  }catch{if(epoch.current===currentEpoch)E('그래프 서버에 연결하지 못했습니다. 5176 서버 실행을 확인한 뒤 다시 연결하세요. 업무 기록은 유지됩니다.');}
  finally{if(epoch.current===currentEpoch){connectLock.current=false;C(false)}}
 };
 const publish=async(snapshot:GraphProjectionSnapshot)=>{
  const fixed=sessionRef.current,currentEpoch=epoch.current;if(!fixed)return;
  try{const result=await port.publish(fixed.producerToken,snapshot);if(currentEpoch!==epoch.current)return;accept(result);if(pending.current?.sequence===snapshot.sequence){pending.current=null;E('');}}
  catch{if(currentEpoch===epoch.current&&pending.current?.sequence===snapshot.sequence)E('그래프 게시 결과를 확인하지 못했습니다. 업무 반영은 유지됩니다. 상태 확인 후 같은 게시를 재확인할 수 있습니다.');}
 };
 useEffect(()=>{
  if(!session||options.disabled||(options.state.unresolvedActionKeys?.length??0)>0)return;
  const content=graphProjectionContent(options.state,latest.current.objects,latest.current.relations,options.companyId),key=JSON.stringify(content);
  if(lastContent.current===key)return;lastContent.current=key;
  const snapshot:GraphProjectionSnapshot={...content,sourceId:session.sourceId,sequence:++sequence.current,publishedAt:new Date().toISOString(),selectedId:latest.current.selectedId||null};
  pending.current=snapshot;E('');void publish(snapshot);
 },[session,options.state,options.disabled]);
 useEffect(()=>{
  if(!session)return;let disposed=false;const currentEpoch=epoch.current;let timer:ReturnType<typeof setTimeout>;
  const poll=async()=>{try{const result=await port.status(session.producerToken);if(disposed||currentEpoch!==epoch.current)return;accept(result);NE('');if(pending.current&&(result.receivedSequence??0)>=pending.current.sequence){pending.current=null;E('');}}
   catch{if(!disposed&&currentEpoch===epoch.current)NE('그래프'+' 서버 조회 실패 · 마지막 확인 값입니다.');}
   finally{if(!disposed)timer=setTimeout(poll,700)}};void poll();return()=>{disposed=true;clearTimeout(timer)};
 },[session]);
 useEffect(()=>{
  const fixed=sessionRef.current;if(!fixed)return;
  graphWindow.current?.postMessage({type:'ontologics.graph.context',sessionId:fixed.sessionId,companyId:options.companyId,ledgerVersion:options.state.version,entityId:options.selectedId,sequence:sequence.current},GRAPH_SERVER);
 },[options.selectedId,options.state,session]);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{const fixed=sessionRef.current,value=event.data,current=latest.current;
   if(event.origin!==GRAPH_SERVER||event.source!==graphWindow.current)return;
   if(value?.type==='ontologics.graph.ready'){graphWindow.current?.postMessage(fixed&&!current.disabled&&value.sessionId===fixed.sessionId?{type:'ontologics.graph.owner',sessionId:fixed.sessionId,companyId:current.companyId,ledgerVersion:current.state.version,entityId:current.selectedId,sequence:sequence.current}:{type:'ontologics.graph.revoke',sessionId:value.sessionId},GRAPH_SERVER);return;}
   if(!fixed||current.disabled||value?.type!=='ontologics.graph.select'||value.sessionId!==fixed.sessionId||value.companyId!==current.companyId||value.ledgerVersion!==current.state.version)return;
   if(current.objects.some(e=>e.id===value.entityId&&e.company===current.companyId))current.onSelect(value.entityId);
  };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
 },[]);
 const open=()=>{const fixed=sessionRef.current;if(!fixed)return;const hash=new URLSearchParams({token:fixed.readToken,object:latest.current.selectedId,sourceOrigin:location.origin,sessionId:fixed.sessionId});graphWindow.current=window.open(GRAPH_SERVER+'/#'+hash,'ontologics-graph-'+fixed.sessionId);if(!graphWindow.current)E('새 창이 차단되었습니다. 이 사이트의 팝업을 허용한 뒤 별도 그래프 열기를 다시 누르세요.');};
 const retry=async()=>{if(pending.current)await publish(pending.current);else if(sessionRef.current){try{accept(await port.status(sessionRef.current.producerToken));E('');NE('')}catch{NE('그래프 서버 조회 실패 · 마지막 확인 값입니다.')}}};
 const awaiting=(options.state.unresolvedActionKeys?.length??0)>0;
 const synchronized=!!session&&!networkError&&!error&&!awaiting&&status?.state==='ready'&&status.graphVersion===options.state.version&&status.projectedSequence===sequence.current;
 return {session:!!session,connecting,status,error:error||networkError||(status?.state==='failed'?(status.error??'그래프 투영 실패 · 연결을 해제한 뒤 다시 연결하세요.'):''),awaiting,synchronized,connect,disconnect,open,retry,companyId:options.companyId,ledgerVersion:options.state.version,disabled:options.disabled,sequence:sequence.current};
}
type Connection=ReturnType<typeof useGraphConnection>;
export const GraphConnectionContext=createContext<Connection|null>(null);
export function GraphConnectionPanel({compact=false}:{compact?:boolean}){
 const connection=useContext(GraphConnectionContext);if(!connection||connection.companyId!=='A'||connection.disabled)return null;
 const {session,connecting,status,error,awaiting,synchronized}=connection;
 return <section className={'graph-connection '+(compact?'compact':'')} aria-label="별도 그래프 연결 상태" data-view-state="true">
  <div className="graph-connection-summary"><Network size={16}/><strong>별도 그래프</strong><span>업무 기록 <b>v{connection.ledgerVersion}</b> · 로컬 저장</span><span className={synchronized?'projection-ready':'projection-pending'}>그래프 <b>{status?.graphVersion==null?'미확인':'v'+status.graphVersion}</b> · {status?.state==='failed'?'투영 실패':error?'확인 실패':awaiting?'업무 결과 확인 대기':synchronized?'갱신 완료':session?'갱신 대기':'미연결'}</span></div>
  <div className="graph-connection-actions">{!session?<Button disabled={connecting} onClick={connection.connect}>{connecting?'연결 중…':'그래프 서버 연결'}</Button>:<><Button onClick={connection.open}><ExternalLink size={13}/>별도 그래프 열기</Button>{error&&status?.state!=='failed'&&<Button onClick={connection.retry}><RefreshCw size={13}/>같은 게시 재확인</Button>}<Button onClick={connection.disconnect} aria-label="그래프 연결 해제"><Unplug size={13}/>{!compact&&'연결 해제'}</Button></>}</div>
  {error&&<p className="graph-connection-error" role="status">{error}</p>}
  {!compact&&<p className="graph-connection-note">127.0.0.1:5176 · 브라우저 Mock 기록의 조회용 사본. 승인 상태와 수량 반영을 분리하며, 계정 전환 시 다시 연결합니다. 운영 DB·RDF 엔진·실시간 공동 편집은 미연결입니다.{status?.projectedAt&&<> 마지막 그래프 갱신 {new Date(status.projectedAt).toLocaleTimeString('ko-KR')} · 게시 #{status.projectedSequence}</>}</p>}
 </section>;
}
