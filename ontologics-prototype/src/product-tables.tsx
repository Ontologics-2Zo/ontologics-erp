import {useApp} from './context';
import {Badge,Button} from './ui';
import {WorkflowTable,WorkflowPhoto,WorkflowObject} from './workflow-tables';
import {SNAPSHOT_AT} from './entity-data';
import catalog from './catalog.json';
import {actualBoms,actualBomForSource,type ActualBomKey} from './actual-boms';
import {getBomRegistration,isBomRegistered} from './bom-registration';

export type ProductBomRow={row:number;sheet:string;cells:readonly string[];quantity:string;item:string;position:string;mount:string;diff:string};
type Revision=ActualBomKey;
function OriginalBasis({revision,row,sourceId}:{revision:string;row?:number;sourceId?:string}){
 const source=catalog.find(c=>c.id===(sourceId??actualBoms[revision as Revision].sourceId))!;
 return <span className="workflow-basis"><span>실제 공개 원본 · {revision}</span><small>commit {source.commit.slice(0,12)}</small><small>{source.id}{row?' · 행 '+row:''}</small><small>합성 업무 기준 {SNAPSHOT_AT.replace('T',' ').replace('+09:00',' KST')}</small></span>;
}
export function ProductSourceTable({uploaded}:{uploaded:string}){
 const {evidence}=useApp();
 return <WorkflowTable tableKey="product-sources" data={catalog} getRowId={row=>row.id} contextId={row=>actualBomForSource(row.id)?.configurationId} searchLabel="원본 파일·개정·근거 ID 검색" footer="포함된 원본 목록입니다. 행 선택은 원본 접수·변형 변경·승인·반영이 아닙니다. 사진은 해당 구성의 참고 자산이며 원본 도면이나 개정 일치 증거가 아닙니다." columns={[
  {id:'photo',header:'구성 참고',enableHiding:false,cell:c=><WorkflowPhoto id={actualBomForSource(c.row.original.id)!.configurationId}/>},
  {id:'object',header:'모델 · 개정 구성',enableHiding:false,accessorFn:r=>actualBomForSource(r.id)?.modelName+' '+r.revision,cell:c=><WorkflowObject id={actualBomForSource(c.row.original.id)!.configurationId} detail="원문 파일 기준 · 개정·구성 미검수"/>},
  {id:'source',header:'원본 파일 · ID',accessorFn:r=>r.filename+' '+r.id,cell:c=><div className="workflow-cell"><button className="text-btn" data-focus-key={'product-'+c.row.original.id} onClick={()=>evidence(c.row.original.id)}>{c.row.original.filename}</button><small>{c.row.original.id} · {c.row.original.filename.split('.').pop()?.toUpperCase()}</small></div>},
  {id:'reception',header:'원본 확인 상태',accessorFn:r=>uploaded===r.sha256?'해시 접수 일치':'포함 자료',cell:c=><div className="workflow-cell"><Badge tone={uploaded===c.row.original.sha256?'blue':'gray'}>{uploaded===c.row.original.sha256?'해시 접수 일치':'포함 자료'}</Badge><small>등록 승인·반영과 별개</small></div>},
  {id:'unknown',header:'미확인 · 검토',cell:c=><div className="workflow-cell"><span>{actualBomForSource(c.row.original.id)?.worksheetLabels.join(' / ')||'CSV 원본 · 구성 변형 미확인'}</span><small>개정·실물 외형 일치 미검수</small></div>},
  {id:'next',header:'다음 조치',cell:c=><Button onClick={()=>evidence(c.row.original.id)}>원본 근거 확인</Button>},
  {id:'basis',header:'데이터 기준',cell:c=><div className="workflow-cell"><OriginalBasis revision={c.row.original.revision} sourceId={c.row.original.id}/><small title={c.row.original.sha256}>SHA-256 {c.row.original.sha256.slice(0,12)}…</small></div>}
 ]}/>;
}
export function ProductBomTable({revision,rows}:{revision:Revision;rows:ProductBomRow[]}){
 const {evidence}=useApp(),definition=actualBoms[revision];
 return <WorkflowTable key={revision} tableKey={'product-bom-'+revision} data={rows} getRowId={row=>definition.partPrefix.replace(/^PART-/,'BOM-')+'-'+row.row} contextId={row=>definition.partPrefix+'-'+row.row} pageSizes={[15,30,75]} searchLabel="품목 또는 참조 위치 검색" footer="수량은 단일단계 BOM 원문 표기이며 재고·생산 수요·실제 장착 수량이 아닙니다. 같은 참조 위치 비교는 개정 간 동일 품목·호환성 승인을 의미하지 않습니다. 행 ID는 원본 개정과 행 번호로 구분합니다." columns={[
  {id:'photo',header:'품목 참고',enableHiding:false,cell:c=><WorkflowPhoto id={definition.partPrefix+'-'+c.row.original.row}/>},
  {id:'object',header:'품목 원문 · 객체',enableHiding:false,accessorFn:r=>r.item,cell:c=><WorkflowObject id={definition.partPrefix+'-'+c.row.original.row} detail="BOM 원문 품목 · 사내 매핑 별도"/>},
  {id:'row',accessorKey:'row',header:'원본 행',cell:c=><button className="text-btn" data-focus-key={'product-row-'+revision+'-'+c.getValue()} onClick={()=>evidence(definition.sourceId,c.getValue())}>행 {c.getValue()}</button>},
  {id:'quantity',header:'원문 수량 · 단위 미확인',accessorFn:r=>r.quantity!==''&&Number.isFinite(Number(r.quantity))?Number(r.quantity):undefined,sortUndefined:'last',cell:c=><span className="work-quantity"><strong>{c.row.original.quantity||'미기재'} <small>단위 미확인</small></strong><span>원문 표기 · 실장 수량 아님</span></span>},
  {id:'position',accessorKey:'position',header:'참조 위치',cell:c=><span>{c.getValue()||'미기재'}</span>},
  {id:'mount',accessorKey:'mount',header:'실장 확인',cell:c=><div className="workflow-cell"><Badge tone={c.getValue()==='미확인'?'amber':'gray'}>{c.getValue()}</Badge><small>실제 장착은 사건 근거 필요</small></div>},
  {id:'diff',accessorKey:'diff',header:'원문 개정 비교',cell:c=><div className="workflow-cell"><Badge tone={c.getValue()==='변경'?'blue':'gray'}>{c.getValue()}</Badge><small>{revision==='L'||revision==='L1'?'PoE L/L1 같은 참조 위치 기준':'대응 개정 원본 미확보'}</small></div>},
  {id:'basis',header:'데이터 기준 · 근거',cell:c=><OriginalBasis revision={definition.revision} row={c.row.original.row} sourceId={definition.sourceId}/>}
 ]}/>;
}
export function ProductRegistrationTable({revision,mapping,reviewed,uploaded}:{revision:ActualBomKey;mapping:string;reviewed:boolean;uploaded:string}){
 const {s,evidence,go}=useApp(),definition=actualBoms[revision],isPoe=revision==='L'||revision==='L1';
 const source=catalog.find(c=>c.id===definition.sourceId)!,registration=getBomRegistration(s,revision),registered=isBomRegistered(s,revision),matches=uploaded===source.sha256;
 const rows=[{id:revision+'-REGISTRATION-INPUT',configuration:definition.configurationId,mapping,reviewed,uploaded}];
 return <WorkflowTable tableKey="product-registration" data={rows} getRowId={row=>row.id} contextId={row=>row.configuration} searchable={false} footer="현재 등록 입력의 요약입니다. 저장된 초안 ID나 승인 기록이 아닙니다. 초안 저장 후 검토·승인 목록에서 정확 버전과 작성자/승인자를 확인합니다." columns={[
  {id:'photo',header:'구성 참고',enableHiding:false,cell:c=><WorkflowPhoto id={c.row.original.configuration}/>},
  {id:'object',header:'등록 대상',enableHiding:false,cell:c=><WorkflowObject id={c.row.original.configuration} detail={`${definition.modelName} · Rev ${definition.revision} · 고정 원본 스냅샷`}/>},
  {id:'mapping',accessorKey:'mapping',header:'입력 범위',cell:c=><div className="workflow-cell"><span>{isPoe?c.getValue():'선택 구성 ID 일치'}</span><small>{isPoe?'파일명 WROOM / 내부 시트명 불일치 보존':'구성 변형·정확 MPN 미확인 유지'}</small></div>},
  {id:'source',header:'접수 · 등록 근거',cell:()=> <div className="workflow-cell"><Badge tone={matches?'blue':'amber'}>{matches?'선택 원본 해시 접수 일치':uploaded?'다른 원본 접수':'접수 전'}</Badge><button className="text-btn" onClick={()=>evidence(source.id)}>{source.id}</button><small>SHA-256 {source.sha256.slice(0,12)}…</small>{uploaded&&!matches&&<small>접수 해시와 선택 구성의 등록 근거가 다름 · 확인 필요</small>}</div>},
  {id:'status',header:'검토 · 반영 상태',cell:()=> <div className="workflow-cell"><Badge tone={reviewed?'blue':'amber'}>{reviewed?'미확인 보존 확인':'미확인 검토 전'}</Badge><small>{registered?'선택 구성 등록 반영됨 · 현재 입력의 승인 아님':'선택 구성 등록 미반영'}</small>{registration&&<small>초안 v{registration.draftVersion} → 데이터 v{registration.appliedDataVersion}</small>}</div>},
  {id:'unknown',header:'미확인',cell:()=> <div className="workflow-cell"><span>미기재·NA / NS / Opened / Closed·중복 원문 보존</span><small>실장·단위·MPN·호환·확정 소요 미검증</small></div>},
  {id:'next',header:'다음 조치',cell:()=> <Button onClick={()=>go('UI05')}>저장 초안 검토 목록</Button>},
  {id:'basis',header:'데이터 기준',cell:()=> <div className="workflow-cell"><OriginalBasis revision={definition.revision} sourceId={source.id}/><small>로컬 현재 v{s.version} · 미저장 입력</small></div>}
 ]}/>;
}
