import {describe,it,expect} from 'vitest';
import {initial,defaultConditions} from '../src/domain';
import {entityById} from '../src/entity-data';
import {contextualExampleAnswer} from '../src/context-answer';

describe('선택한 원본의 AI 예시 범위',()=>{
 it.each([['CFG-POEISO-N',75],['CFG-EVB-C',71],['CFG-GATEWAY-I',62]] as const)('%s에 PoE 납품100대 원장을 섞지 않는다',(id,rows)=>{
  const answer=contextualExampleAnswer({...initial(),production:60,stock:50},'UI08','수량과 납품 잔량',defaultConditions,entityById(id));
  expect(answer).toContain(rows+'행');expect(answer).toContain('단위·실장·정확 MPN은 미확인');expect(answer).not.toContain('약속 100대');expect(answer).not.toContain('정상 완료 60대');
 });
 it('원문 품목의 수량 표기와 합성 구매80EA를 별개로 설명한다',()=>{
  const source=contextualExampleAnswer(initial(),'MAP','수량',defaultConditions,entityById('PART-EVB-C-21'));
  const purchase=contextualExampleAnswer(initial(),'PURCHASE','수량',defaultConditions,entityById('IM-EVB-C-C18-C26'));
  expect(source).toContain('수량 표기 2');expect(source).not.toContain('80 EA');expect(purchase).toContain('80 EA');expect(purchase).toContain('시연의 가정');
 });
});
