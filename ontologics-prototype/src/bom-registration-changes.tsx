import {useState} from 'react';
import {actualBomList,actualBoms,type ActualBomKey} from './actual-boms';
import {getBomRegistration} from './bom-registration';
import {registrationGraph,registrationObjectId,registrationStatus} from './bom-registration-graph';
import {useApp} from './context';
import {EntityChip,useEntity,TraceGraph} from './entity';
import {Badge,Button,Notice,Panel,useStored} from './ui';

export function BomRegistrationChanges({snapshotKey}:{snapshotKey:ActualBomKey}){
 const {s,go,evidence}=useApp(),ctx=useEntity(),bom=actualBoms[snapshotKey],record=getBomRegistration(s,snapshotKey),[,setOntologyTab]=useStored('workflow-view-ontology-tab','map');
 if(ctx.company!=='A')return null;
 const graph=record?registrationGraph(record):null;
 return <section aria-label="BOM 반영 전후" data-testid={'bom-registration-changes-'+snapshotKey}>
  <Panel title="등록 반영 전후 · ABox 변경" subtitle={`${bom.modelName} / ${bom.revision} · ${bom.configurationId}`} action={<Badge tone={record?'green':'gray'}>{record?'로컬 반영 완료':'현재 미반영'}</Badge>}>
   <div className="inset">
    <Notice>원본의 모델·구성·BOM {bom.lines.length}행과 설계 관계는 접수 전부터 조회 자료로 존재합니다. 초안·검토·승인만으로 등록 반영 객체를 생성하지 않습니다.</Notice>
    <div className="table-scroll"><table className="registration-delta"><caption>{record?`반영 기록: 데이터 v${record.baseVersion} → v${record.appliedDataVersion}`:'아래는 등록 명령 반영 시의 변경 범위 · 아직 실행되지 않음'}</caption><thead><tr><th>대상</th><th>반영 전</th><th>{record?'반영 후':'반영할 내용'}</th></tr></thead><tbody>
     <tr><th>제품 구성</th><td>원문 조회 · 이번 정확 등록 기록 없음</td><td>원문 유지 + 정확 승인 버전 등록 상태</td></tr>
     <tr><th>ABox 객체</th><td>이번 등록의 기록·문서 연결 없음</td><td>등록 반영 기록 1개 + 원본 문서 객체 1개</td></tr>
     <tr><th>ABox 관계</th><td>기존 설계 BOM 관계</td><td>기존 관계 유지 + 등록 대상·정확 원본·원본 구성 연결 3개</td></tr>
     <tr><th>단위·실장·정확 품번</th><td>미확인 / 독립 검수 전</td><td>미확인 유지 · 등록 승인으로 검수 완료되지 않음</td></tr>
     <tr><th>재고·예약·생산·납품</th><td>각 합성 업무의 현재 수량</td><td>변화 없음 · 별도 업무 행동 필요</td></tr>
    </tbody></table></div>
    {record&&graph?<><div className="badge-row"><Badge tone="green">객체 +2 · 관계 +3 · 구성 속성 갱신</Badge><span>{record.author} 작성 → {record.approvedBy} 승인 · 초안 v{record.draftVersion}</span></div><dl className="details"><dt>정확 승인 초안</dt><dd>{record.draftId} · v{record.draftVersion}</dd><dt>승인 내용 SHA-256</dt><dd className="mono">{record.draftHash}</dd><dt>원본 SHA-256</dt><dd className="mono">{record.sourceHash}</dd><dt>로컬 반영 시각</dt><dd>{record.appliedAt}</dd></dl><div className="actions"><EntityChip id={registrationObjectId(record)}/><EntityChip id={record.configurationId}/><EntityChip id={record.sourceId}/><Button onClick={()=>{ctx.select(registrationObjectId(record),false);setOntologyTab('map');go('MAP')}}>ABox에서 반영 관계 보기</Button><Button onClick={()=>evidence(record.sourceId)}>등록 원본 확인</Button></div><details><summary>추가된 방향·범위·근거 관계 3개</summary>{graph.links.map(link=><p key={link.id}><EntityChip id={link.from} compact/> → {link.label} → <EntityChip id={link.to} compact/><small className="muted"> {link.scope}</small></p>)}</details></>:<p className="muted">{registrationStatus(s,snapshotKey)} · 원본 확인 → 등록 초안 → 검토 요청 → Bob 승인 → 정확 승인 버전 반영 순서로 확인하세요.</p>}
   </div>
  </Panel>
 </section>;
}

export function BomRegistrationOverview(){
 const {s}=useApp(),ctx=useEntity(),[chosen,Choose]=useState<ActualBomKey>(()=>actualBomList.find(b=>b.configurationId===ctx.selectedId)?.key??'L1');
 const active=actualBomList.find(b=>b.configurationId===ctx.portContext.configurationId)?.key??chosen;
 if(ctx.company!=='A')return null;
 return <details className="bom-review-original" open><summary>실제 BOM 등록 · ABox 반영 내역</summary><div className="inset"><div className="toolbar" data-view-state="true"><label>반영 내역 구성 <select aria-label="ABox 등록 구성" value={active} onChange={event=>{const key=event.target.value as ActualBomKey;Choose(key);ctx.select(actualBoms[key].configurationId,false)}}>{actualBomList.map(bom=><option key={bom.key} value={bom.key}>{bom.modelName} / {bom.revision} · {registrationStatus(s,bom.key)}</option>)}</select></label></div><BomRegistrationChanges snapshotKey={active}/>{getBomRegistration(s,active)&&<TraceGraph mode="flow" rootId={registrationObjectId(getBomRegistration(s,active)!)}/>}</div></details>;
}
