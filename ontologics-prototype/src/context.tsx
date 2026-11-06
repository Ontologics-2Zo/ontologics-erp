import {createContext,useContext} from 'react';
import type {State,Actor,Payload,Conditions} from './domain';
import type {ActionCommand,ActionResult} from './ports';
export type UIActionCommand=Omit<ActionCommand,'context'|'expectedVersion'|'idempotencyKey'>;
export type AppContext={s:State;set:(s:State)=>void;actor:Actor;page:string;go:(p:string)=>void;run:(fn:()=>void|Promise<void>)=>Promise<void>;busy:boolean;submit:(p:Payload,title:string,origin:string)=>Promise<void>;action:(command:UIActionCommand,key?:string)=>Promise<ActionResult>;setReviewContext:(draftId:string|null)=>void;evidence:(id:string,row?:number)=>void;conditions:Conditions;setConditions:(c:Conditions)=>void;toast:(message:string)=>void};
export const Context=createContext<AppContext>(null!);
export const useApp=()=>useContext(Context);
