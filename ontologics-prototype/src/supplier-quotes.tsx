import {flexRender,type Row} from '@tanstack/react-table';
import {ArrowDownWideNarrow,Building2,Check} from 'lucide-react';
import {Badge,Button,type DataTableContentProps} from './ui';
import './supplier-quotes.css';

type SupplierQuote={id:string;supplier:string;shipping:number|null};
const terms=['quantity','moq','price','cost','supply','needDate','review'];
const isControl=(target:EventTarget)=>target instanceof Element&&!!target.closest('button,a,input,label,select,textarea,[role="button"],[role="dialog"],.overlay,.entity-chip-wrap');

/** Cards present the existing quote rows. All quantities and actions stay in PurchaseQuoteTable. */
export function SupplierQuoteCards<T extends SupplierQuote>({rows,table,activeRowId,onActiveRow,selectedId}:DataTableContentProps<T>&{selectedId:string}){
 const sort=table.getState().sorting[0];
 const sortable=table.getAllLeafColumns().filter(column=>column.getCanSort());
 const cell=(row:Row<T>,id:string)=>{
  const found=row.getVisibleCells().find(item=>item.column.id===id);
  return found?flexRender(found.column.columnDef.cell,found.getContext()):null;
 };
 const visible=(row:Row<T>,id:string)=>row.getVisibleCells().some(item=>item.column.id===id);
 return <>
  <div className="supplier-card-tools" data-view-state="true">
   <label className="supplier-list-check"><input type="checkbox" aria-label="현재 페이지 모두 선택" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()}/>현재 페이지 목록 선택</label>
   <div className="supplier-card-sorting">
    <label><ArrowDownWideNarrow size={15}/><span>정렬</span><select aria-label="견적 정렬 기준" value={sort?.id??''} onChange={event=>table.setSorting(event.target.value?[{id:event.target.value,desc:false}]:[])}><option value="">기본 순서</option>{sortable.map(column=><option key={column.id} value={column.id}>{typeof column.columnDef.header==='string'?column.columnDef.header:column.id}</option>)}</select></label>
    <Button disabled={!sort} aria-label="견적 정렬 방향" onClick={()=>sort&&table.setSorting([{id:sort.id,desc:!sort.desc}])}>{sort?.desc?'내림차순':'오름차순'}</Button>
   </div>
  </div>
  <div className="supplier-quote-cards" aria-label="공급사별 견적 비교">
   {rows.map(row=><article key={row.id} className="supplier-quote-card" aria-label={row.original.supplier+' 견적 '+row.id} data-row-id={row.id} data-active={activeRowId===row.id} data-comparison-selected={selectedId===row.id} data-list-selected={row.getIsSelected()} aria-current={activeRowId===row.id?'true':undefined} tabIndex={0}
    onFocus={event=>{if(event.target===event.currentTarget)onActiveRow?.(row.original)}}
    onClick={event=>{if(!isControl(event.target))onActiveRow?.(row.original)}}
    onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onActiveRow?.(row.original)}}}>
    <header className="supplier-card-heading">
     <div className="supplier-heading-identity"><span className="supplier-symbol" aria-hidden="true"><Building2 size={21}/></span><div><h3>{row.original.supplier}</h3><code>{row.id}</code></div></div>
     <div className="supplier-card-labels"><Badge>합성 견적</Badge>{selectedId===row.id&&<span className="supplier-current"><Check size={12}/>현재 비교안</span>}</div>
    </header>
    <div className="supplier-card-object" data-column-id="object"><div data-column-id="photo">{cell(row,'photo')}</div>{cell(row,'object')}</div>
    <dl className="supplier-card-terms">{terms.filter(id=>visible(row,id)).map(id=>{
     const column=table.getColumn(id)!;
     return <div key={id} className={'supplier-term supplier-term-'+id} data-column-id={id}><dt>{typeof column.columnDef.header==='string'?column.columnDef.header:id}</dt><dd>{cell(row,id)}</dd></div>;
    })}</dl>
    {visible(row,'basis')&&<div className="supplier-card-basis" data-column-id="basis"><strong>데이터 기준 / 근거</strong>{cell(row,'basis')}</div>}
    <footer className="supplier-card-actions"><label className="supplier-list-check"><input data-view-state="true" type="checkbox" aria-label={row.id+' 행 선택'} checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()}/>목록 선택</label><div data-column-id="next">{cell(row,'next')}</div></footer>
   </article>)}
  </div>
 </>;
}
