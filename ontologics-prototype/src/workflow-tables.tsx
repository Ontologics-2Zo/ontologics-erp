import type {ReactNode} from 'react';
import {ImageOff} from 'lucide-react';
import {DataTable,useStored,type DataTableProps} from './ui';
import {EntityChip,useEntity} from './entity';
import {EntityThumbnail} from './media';
import {SNAPSHOT_AT} from './entity-data';
import './work-tables.css';
import './workflow-tables.css';

type WorkflowTableProps<T> = Omit<DataTableProps<T>,'viewStateKey'|'activeRowId'|'onActiveRow'> & {
 tableKey:string;
 contextMode?:'object'|'reference';
 getRowId:(row:T,index:number)=>string;
 contextId:(row:T)=>string|undefined;
 onActivate?:(row:T)=>void;
 activeId?:string;
 footer?:ReactNode;
};

/** View state only. Selection never submits an action or invokes an Agent. */
export function WorkflowTable<T>({tableKey,contextMode='object',contextId,onActivate,activeId,footer,...props}:WorkflowTableProps<T>){
 const {select,selectedId,resolve}=useEntity();
 const [active,setActive]=useStored('workflow-view-active-'+tableKey,'');
 const activeRow=props.data.find((row,index)=>props.getRowId(row,index)===active);
 const referenced=activeRow&&contextMode==='object'?contextId(activeRow):undefined;
 const target=referenced&&resolve(referenced)?referenced:undefined;
 const validActive=activeRow&&(!target||target===selectedId)?active:undefined;
 const activate=(row:T)=>{
  const index=props.data.indexOf(row);setActive(props.getRowId(row,index));
  const id=contextMode==='object'?contextId(row):undefined;if(id&&resolve(id))select(id,false);
  onActivate?.(row);
 };
 return <div className="dense-workspace-table workflow-table" data-workflow-grid={tableKey}>
  <div className="list-context-bar"><span>{contextMode==='reference'?<>행 선택 <strong>목록 참조</strong><i/>업무 객체·AI 대상 <strong>유지</strong></>:<>사진 <strong>확대·출처</strong><i/>객체 이름 <strong>상세·관계</strong><i/>행 선택 <strong>AI 맥락 공유</strong></>}</span><span>{contextMode==='reference'?'현재 AI 객체':activeRow&&!target?'선택 행의 객체 연결 미확인 · 현재 AI 대상 유지':'현재 객체'} <code>{selectedId||'선택 없음'}</code></span></div>
  <DataTable {...props} pageSizes={props.pageSizes??[5,15,30]} viewStateKey={'workflow-'+tableKey} activeRowId={activeId??validActive} onActiveRow={activate}/>
  <div className="list-footnote">{footer??(contextMode==='reference'?'체크는 이 목록의 참조 선택입니다. 업무 객체·AI 대상이나 승인·원장 상태를 변경하지 않습니다.':'체크는 목록 선택입니다. 업무 변경·승인·반영은 해당 행동에서 대상과 버전을 다시 확인합니다.')}</div>
 </div>;
}

export function WorkflowPhoto({id}:{id?:string}){
 const {resolve}=useEntity();const entity=id?resolve(id):undefined;
 return entity?<EntityThumbnail entity={entity} size="small" interactive/>:<span className="work-photo-unknown" aria-label="사진 대상 연결 미확인"><ImageOff size={18}/><small>연결 미확인</small></span>;
}

export function WorkflowObject({id,detail}:{id?:string;detail?:string}){
 return <div className="workflow-object">{id?<EntityChip id={id} showMedia={false}/>:<span className="muted">객체 연결 미확인</span>}{detail&&<small>{detail}</small>}</div>;
}

export function QuantityCell({value,unit,note}:{value:number|null;unit:string;note?:string}){
 return <span className="work-quantity"><strong>{value===null?'미확인':value.toLocaleString()} <small>{unit}</small></strong>{note&&<span>{note}</span>}</span>;
}

export function WorkflowBasis({version,at=SNAPSHOT_AT,evidence}:{version?:number|string;at?:string;evidence?:string}){
 return <span className="workflow-basis"><span>{at.replace('T',' ').replace('+09:00',' KST')}</span><small>로컬 합성{version!==undefined?' · v'+version:''}</small>{evidence&&<small title={evidence}>{evidence}</small>}</span>;
}
