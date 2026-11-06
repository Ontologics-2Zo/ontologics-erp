import {materialQuantities,receive,validate,type Draft,type Payload,type State} from './domain';
import {isBomRegistered,resolveBomRegistration} from './bom-registration';
import type {ActualBomKey} from './actual-boms';

export type ImpactKind='bom'|'material_receipt';
export type ImpactMetrics=ReturnType<typeof materialQuantities>&{
 bomApplied:boolean;receiptTotal:number|null;receiptPass:number|null;unallocatedPass:number|null;
};
export function impactMetrics(state:State,snapshotKey:ActualBomKey='L1'):ImpactMetrics{
 return {...materialQuantities(state),bomApplied:isBomRegistered(state,snapshotKey),receiptTotal:state.receipt?.total??null,
  receiptPass:state.receipt?.pass??null,unallocatedPass:state.receipt?state.receipt.pass-state.materialAllocated:null};
}
export type ChangeProjection={status:'candidate'|'stale'|'applied'|'none'|'unsupported'|'invalid';current:ImpactMetrics;projected:ImpactMetrics|null;reason:string};

/** Local, read-only projection. It never approves a draft or changes a ledger/version. */
export function projectChangeImpact(state:State,draft?:Draft,hypothesis?:Payload,snapshotKey:ActualBomKey='L1'):ChangeProjection{
 const payload=hypothesis??draft?.payload;
 let key=snapshotKey;try{if(payload?.kind==='bom')key=resolveBomRegistration(payload).key}catch{/* validate below reports incomplete binding without guessing another snapshot. */}
 const current=impactMetrics(state,key),result=(status:ChangeProjection['status'],reason:string,projected:ImpactMetrics|null=null)=>({status,current,projected,reason});
 if(draft&&(draft.status==='반영 완료'||state.applied[draft.requestKey]))return result('applied','이미 반영된 초안입니다. 같은 입고를 가정에 다시 더하지 않습니다.');
 if(draft&&draft.base!==state.version)return result('stale',`초안 기준 v${draft.base}와 현재 데이터 v${state.version}가 다릅니다. 최신 기준으로 새 초안을 검토해야 합니다.`);
 if(draft&&hypothesis&&draft.payload.kind!==hypothesis.kind)return result('invalid','저장 초안과 다른 업무 종류를 가정에 섞을 수 없습니다.');
 if(!payload)return result('none','저장된 초안이 없습니다. 원본을 검토하고 초안을 저장하면 반영 가정을 비교할 수 있습니다.');
 if(payload.kind!=='bom'&&payload.kind!=='material_receipt')return result('unsupported','이 업무의 수량 예측은 아직 연결되지 않았습니다. 검토 원문과 개별 업무 화면을 확인하세요.');
 try{
  const copy=structuredClone(state);
  validate(copy,payload);
  const projected=payload.kind==='bom'?{...impactMetrics(copy,key),bomApplied:true}:impactMetrics(receive(copy,Number(payload.total),Number(payload.pass),Number(payload.fail),Number(payload.pending),String(payload.evidence)),key);
  return result('candidate',payload.kind==='bom'?'선택 구성의 등록 상태와 승인 근거 연결이 달라지는 가정입니다. BOM 원문·미검수 상태·자재 소요는 자동 변경하지 않습니다.':'입고·검사 누계만 달라지는 가정입니다. 이 계획의 확보량은 별도 합격분 할당 전까지 그대로입니다.',projected);
 }catch(error){return result('invalid',error instanceof Error?error.message:'가정 입력을 확인하세요.');}
}

export function impactNextStep(metrics:Pick<ImpactMetrics,'unsecured'|'unallocatedPass'|'unreservedOriginal'>,demandConfirmed:boolean){
 if(!demandConfirmed)return '계약 원문과 정상 제품 수요 100대를 먼저 확인하세요.';
 if(metrics.unsecured===0)return '이 계획의 수량 확보 조건은 충족했습니다. 미확인 실장과 일정 조건은 별도로 검토하세요.';
 if((metrics.unallocatedPass??0)>0)return `합격 미할당 ${metrics.unallocatedPass}개 중 최대 ${Math.min(metrics.unsecured,metrics.unallocatedPass!)}개를 이 계획에 별도로 할당할 수 있습니다. 현재 계획 미확보는 ${metrics.unsecured}개입니다.`;
 if(metrics.unreservedOriginal>0)return `원품 가용 중 이 계획 미예약 ${metrics.unreservedOriginal}개를 확인하고 예약 또는 추가 입고를 검토하세요. 현재 계획 미확보는 ${metrics.unsecured}개입니다.`;
 return `현재 계획 미확보 ${metrics.unsecured}개에 대해 추가 조달·검사 근거를 확인하세요.`;
}
