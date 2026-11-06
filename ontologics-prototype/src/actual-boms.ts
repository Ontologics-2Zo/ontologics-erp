import data from './actual-bom-data.json';

export type ActualBomKey = 'L' | 'L1' | 'ISO-N' | 'EVB-C' | 'GATEWAY-I';
export type ActualBomLine = {
  row:number; sheet:string; cells:[string,string,string,string];
  sourceRowId:string; sourceOrdinal:number; locator:string;
  rawFields:Record<string,string>; rawCells:string[]; referenceTokens:string[];
  sourceQuantity:number|null; quantityUnit:null; populationStatus:'unreviewed';
  reviewStatus:'not_independently_reviewed';
  categoryHint:'component_candidate'|'non_procurement_candidate'|'board_setting_candidate';
  warnings:string[];
};
export type ActualBom = {
  key:ActualBomKey; modelId:string; configurationId:string; modelName:string; revision:string;
  sourceId:string; partPrefix:string; lines:ActualBomLine[];
  source:{snapshotId:string;format:'ods'|'csv';localPath:string;url:string;sha256:string;gitBlobSha1:string;
    repository:string;repositoryPath:string;commit:string;acquisition:string};
  worksheetLabels:string[]; warnings:string[];
};
// All numeric quantities are transcribed source values. No source in this dataset
// independently verifies a unit, population status, manufacturer, or MPN.
// The offline importer validates raw fields, tuple order, hashes and review state;
// JSON's inferred string[] cannot express its four-cell display tuple.
export const actualBomList = data as unknown as ActualBom[];
export const actualBoms = Object.fromEntries(actualBomList.map(bom => [bom.key, bom])) as Record<ActualBomKey,ActualBom>;
export const actualPartId = (bom:ActualBom,line:ActualBomLine) => `${bom.partPrefix}-${line.row}`;
export const actualBomForConfiguration = (id:string) => actualBomList.find(bom => bom.configurationId === id);
export const actualBomForSource = (id:string) => actualBomList.find(bom => bom.sourceId === id || (bom.key === 'L' && id === 'SRC-L-pdf') || (bom.key === 'L1' && id === 'SRC-L1-pdf'));
const partBomIndex = new Map(actualBomList.flatMap(bom => bom.lines.map(line => [actualPartId(bom,line),bom] as const)));
export const actualBomForPart = (id:string) => partBomIndex.get(id);
