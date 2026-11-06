import {useEffect,useRef,useState} from 'react';
import {ImageOff,LoaderCircle,Maximize2,ExternalLink,ShieldAlert} from 'lucide-react';
import type {Entity} from './entity-data';
import {useEntity} from './entity';
import {AI_MEDIA_NOTICE,MEDIA_KIND_LABELS,type EntityMedia} from './media-data';
import {Button,Modal,Notice} from './ui';
import './media.css';

type MediaState='loading'|'ready'|'error'|'unregistered'|'forbidden';
function useMedia(entity:Entity){
 const ctx=useEntity(),identity=`${ctx.company}:${ctx.portContext.identityRevision}:${entity.id}`;
 const [result,Result]=useState<{key:string;state:MediaState;media?:EntityMedia}>({key:identity,state:'loading'});
 const allowed=!!ctx.resolve(entity.id);
 useEffect(()=>{let live=true;Result({key:identity,state:allowed?'loading':'forbidden'});
  if(allowed)ctx.ports.media.get(entity.id,ctx.portContext).then(value=>{if(live)Result({key:identity,state:value.state==='registered'?'ready':'unregistered',media:value.state==='registered'?value.media:undefined})}).catch(error=>{if(live)Result({key:identity,state:error?.code==='FORBIDDEN'?'forbidden':'error'})});
  return()=>{live=false};
 },[identity,allowed,ctx.portContext.dataVersion]);
 if(!allowed)return {state:'forbidden' as const,media:undefined};
 return result.key===identity?result:{state:'loading' as const,media:undefined};
}
function MediaImage({entity,media,state,size}:{entity:Entity;media?:EntityMedia;state:MediaState;size:string}){
 const [loaded,L]=useState(false),[failed,F]=useState(false),img=useRef<HTMLImageElement>(null);
 useEffect(()=>{L(false);F(false);if(img.current?.complete&&img.current.naturalWidth)L(true)},[media?.url]);
 const current=state==='ready'?(failed?'error':loaded?'ready':'loading'):state;
 const label=current==='forbidden'?'사진 접근 권한 없음':current==='error'?'이미지 불러오기 실패':current==='unregistered'?'실물 사진 미등록':'이미지 불러오는 중';
 return <span className={`entity-media media-${size}`} data-entity-id={entity.id} data-asset-id={media?.assetId??''} data-media-state={current}>
  {media&&state==='ready'&&!failed&&<img ref={img} src={media.url} alt={`${entity.name} · ${MEDIA_KIND_LABELS[media.kind]} · ${media.scope}`} loading={size==='tiny'?'lazy':'eager'} decoding="async" onLoad={()=>L(true)} onError={()=>F(true)}/>}
  {current!=='ready'&&<span className="media-placeholder" role="status" aria-label={label}>{current==='loading'?<LoaderCircle className="media-spinner" size={17}/>:current==='forbidden'?<ShieldAlert size={18}/>:<ImageOff size={18}/>}<span>{label}</span></span>}
  {media&&<span className={'media-kind '+(media.kind==='ai-reference'?'is-ai':'')} title={MEDIA_KIND_LABELS[media.kind]}>{MEDIA_KIND_LABELS[media.kind]}</span>}
 </span>;
}
function MediaDialog({entity,media,state,open,onClose}:{entity:Entity;media?:EntityMedia;state:MediaState;open:boolean;onClose:()=>void}){
 const [zoom,Z]=useState(false);useEffect(()=>Z(false),[open,entity.id]);
 return <Modal open={open} onClose={onClose} title="사진·출처" description={`${entity.name} · 이미지 대상 ${entity.id} · 업무 선택 유지`}>
  {media?.kind==='ai-reference'&&<Notice>{AI_MEDIA_NOTICE}</Notice>}
  {media?.kind==='reference-photo'&&<Notice>제조사 제품 참고 사진입니다. 현재 개정·구성·개별 보드와의 일치는 검수하지 않았습니다.</Notice>}
  <div className={'media-viewer '+(zoom?'zoomed':'')}><MediaImage entity={entity} media={media} state={state} size="full"/></div>
  {media&&<><div className="media-viewer-toolbar"><Button onClick={()=>Z(!zoom)}>{zoom?'화면에 맞추기':'이미지 확대'}</Button><span>{MEDIA_KIND_LABELS[media.kind]} · {media.revisionMatch==='verified'?'대상 개정 검수됨':media.revisionMatch==='unverified'?'개정 일치 미검수':'특정 제품 재현 아님'}</span></div><dl className="media-metadata"><dt>대상</dt><dd>{entity.name} <code>{entity.id}</code></dd><dt>표현 범위</dt><dd>{media.scope}</dd><dt>출처</dt><dd>{media.source}{media.sourceUrl&&<a href={media.sourceUrl} target="_blank" rel="noreferrer">제조사 출처 확인 <ExternalLink size={13}/></a>}</dd><dt>자산 / 확보일</dt><dd><code>{media.assetId}</code> · {media.createdAt}</dd><dt>사용 범위</dt><dd>{media.rights}</dd></dl><p className="media-evidence-warning">외형 참고 전용 · 원문 근거, 검사 사진, 실제 장착 증거로 등록하지 않습니다. 호환성·핀배치·실장 위치 판단에는 별도 검증 자료가 필요합니다.</p></>}
  <Button primary onClick={onClose}>선택 객체로 복귀</Button>
 </Modal>;
}
/** Controlled viewer for photos opened from transient previews. Keep it outside the preview portal. */
export function EntityPhotoDialog({entity,open,onClose}:{entity:Entity;open:boolean;onClose:()=>void}){
 const {media,state}=useMedia(entity),ctx=useEntity(),identity=`${ctx.company}:${ctx.portContext.identityRevision}:${entity.id}`,previous=useRef(identity);
 useEffect(()=>{if(previous.current!==identity){previous.current=identity;if(open)onClose()}},[identity,open,onClose]);
 if(state==='forbidden')return null;
 return <MediaDialog entity={entity} media={media} state={state} open={open} onClose={onClose}/>;
}
export function EntityThumbnail({entity,size='small',interactive=false}:{entity:Entity;size?:'tiny'|'small'|'medium'|'large';interactive?:boolean}){
 const {media,state}=useMedia(entity),[open,O]=useState(false),ctx=useEntity();
 useEffect(()=>O(false),[entity.id,ctx.company,ctx.portContext.identityRevision]);
 if(state==='forbidden')return <span className="entity-unavailable">대상 접근 불가</span>;
 const picture=<MediaImage entity={entity} media={media} state={state} size={size}/>;
 if(!interactive)return picture;
 return <><button type="button" className="media-trigger" aria-label={`${entity.name} 이미지 확대 및 출처`} onClick={event=>{event.stopPropagation();O(true)}}>{picture}</button><MediaDialog entity={entity} media={media} state={state} open={open} onClose={()=>O(false)}/></>;
}
export function MediaPanel({entity}:{entity:Entity}){
 const {media,state}=useMedia(entity),[open,O]=useState(false),ctx=useEntity();
 useEffect(()=>O(false),[entity.id,ctx.company,ctx.portContext.identityRevision]);
 if(state==='forbidden')return <span className="entity-unavailable">대상 접근 불가</span>;
 return <><button type="button" className="media-panel" aria-label="사진 및 출처 확인" onClick={()=>O(true)}><MediaImage entity={entity} media={media} state={state} size="large"/><span className="media-expand"><Maximize2 size={12}/> 확대 · 출처</span></button>{media&&<p className="media-caption">{media.kind==='ai-reference'?'실물 사진 미등록 · AI 참고 이미지':media.kind==='reference-photo'?'제조사 참고 사진 · 개정 미검수':MEDIA_KIND_LABELS[media.kind]}</p>}<MediaDialog entity={entity} media={media} state={state} open={open} onClose={()=>O(false)}/></>;
}
