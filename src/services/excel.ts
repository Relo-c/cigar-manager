import * as XLSX from 'xlsx'
import { db } from '../db/database'
import { standardBrandName } from './brandLogos'
import type { BoxInventory, LooseInventory, OperationRecord } from '../types/inventory'

type Row = Record<string, unknown>

export interface ImportPreview {
  boxes: BoxInventory[]
  looseStocks: LooseInventory[]
  operations: OperationRecord[]
  skipped: number
  warnings: string[]
}

const text = (value: unknown): string =>
  value == null || value === '/' ? '' : String(value).trim()
const brandName = (value: unknown): string => {
  const raw = text(value)
  return standardBrandName(raw) ?? raw
}
const number = (value: unknown): number => Number(value) || 0
const now = (): string => new Date().toISOString()
const uid = (): string => crypto.randomUUID()

function year(value: unknown): number {
  const match = text(value).match(/\d{4}/)
  return match ? Number(match[0]) : 0
}

function cabinet(value: unknown): string {
  return text(value).split(/[\-&\n]/)[0]?.trim() ?? ''
}

function dimension(value: unknown): { ringGauge?: number; lengthMm?: number } {
  const [ring, length] = text(value).split('|').map(Number)
  return {
    ringGauge: ring > 0 ? ring : undefined,
    lengthMm: length > 0 ? length : undefined
  }
}

function excelDate(value: unknown): string {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S).toISOString()
  }
  const raw = text(value).replace(/\./g, '-')
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? now() : parsed.toISOString()
}

function rows(workbook: XLSX.WorkBook, sheetName: string): Row[] {
  const sheet = workbook.Sheets[sheetName]
  return sheet ? XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' }) : []
}

export async function previewWorkbook(file: File): Promise<ImportPreview> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })
  const warnings: string[] = []
  let skipped = 0

  const existingBoxes = await db.boxes.toArray()
  const existingLoose = await db.looseStocks.toArray()
  const boxKeys = new Set(existingBoxes.map((box) => box.serialNumber || `${box.brand}|${box.model}|${box.year}|${box.cabinet}|${box.sticksPerBox}`))
  const looseKeys = new Set(existingLoose.map((stock) => `${stock.brand}|${stock.model}|${stock.year}|${stock.cabinet}`))

  const boxes: BoxInventory[] = []
  for (const row of rows(workbook, '原盒')) {
    const brand = brandName(row['品牌']); const model = text(row['型号']); const itemYear = year(row['年份']); const itemCabinet = cabinet(row['柜号'])
    if (!brand || !model || !itemYear || !itemCabinet || number(row['单盒支数']) <= 0) { skipped += 1; warnings.push(`原盒：${brand} ${model || '未知型号'} 缺少必填字段`); continue }
    const serialNumber = text(row['编号']) || undefined
    const key = serialNumber || `${brand}|${model}|${itemYear}|${itemCabinet}|${number(row['单盒支数'])}`
    if (boxKeys.has(key)) { skipped += 1; continue }
    boxKeys.add(key)
    const timestamp = now(); const size = dimension(row['环径'])
    boxes.push({ id: uid(), brand, model, year: itemYear, sticksPerBox: number(row['单盒支数']), cabinet: itemCabinet, customBoxPrice: number(row['单盒价格']), serialNumber, source: text(row['来源']) || undefined, ...size, stockedAt: timestamp, createdAt: timestamp, updatedAt: timestamp })
  }

  const looseStocks: LooseInventory[] = []
  for (const row of rows(workbook, '散支')) {
    const brand=brandName(row['品牌']); const model=text(row['型号']); const itemYear=year(row['年份']); const itemCabinet=cabinet(row['柜号']); const quantity=number(row['支数'])
    if(!brand||!model||!itemYear||!itemCabinet||quantity<=0){skipped+=1;warnings.push(`散支：${brand} ${model||'未知型号'} 缺少必填字段`);continue}
    const key=`${brand}|${model}|${itemYear}|${itemCabinet}`
    if(looseKeys.has(key)){skipped+=1;continue}
    looseKeys.add(key); const timestamp=now()
    looseStocks.push({id:uid(),brand,model,year:itemYear,quantity,cabinet:itemCabinet,customStickPrice:number(row['单支价格']) || (number(row['单盒价格'])/number(row['单盒数量']) || 0),stockedAt:timestamp,createdAt:timestamp,updatedAt:timestamp})
  }

  const operations: OperationRecord[] = []
  for (const row of rows(workbook, '入库')) {
    const brand=brandName(row['品牌']); const model=text(row['型号']); if(!brand||!model)continue
    const timestamp=excelDate(row['时间']); const snapshot={id:uid(),brand,model,year:year(row['年份']),sticksPerBox:number(row['单盒支数']),cabinet:'',customBoxPrice:number(row['价格（元/盒）']),serialNumber:text(row['编号'])||undefined,source:text(row['渠道'])||undefined,stockedAt:timestamp,createdAt:timestamp,updatedAt:timestamp} as BoxInventory
    operations.push({id:uid(),type:'stock-in',inventoryKind:'box',inventoryId:snapshot.id,occurredAt:timestamp,createdAt:timestamp,quantity:number(row['盒数'])||1,snapshot})
  }
  for (const row of rows(workbook, '出库')) {
    const brand=brandName(row['品牌']); const model=text(row['型号']); if(!brand||!model)continue
    const timestamp=excelDate(row['时间']); const snapshot={id:uid(),brand,model,year:year(row['年份']),sticksPerBox:number(row['单盒支数']),cabinet:cabinet(row['柜号']),customBoxPrice:0,serialNumber:text(row['编号'])||undefined,source:text(row['来源'])||undefined,stockedAt:timestamp,createdAt:timestamp,updatedAt:timestamp} as BoxInventory
    operations.push({id:uid(),type:'stock-out',inventoryKind:'box',inventoryId:snapshot.id,occurredAt:timestamp,createdAt:timestamp,quantity:1,snapshot})
  }
  const existingOperationIds = new Set((await db.operations.toArray()).map((item) => item.id))
  for (const row of rows(workbook, '操作记录')) {
    const recordId=text(row['记录ID'])||uid(); if(existingOperationIds.has(recordId)){skipped+=1;continue}
    const operationType=text(row['类型']) as OperationRecord['type']; const inventoryKind=text(row['库存类型']) as OperationRecord['inventoryKind']
    if(!['stock-in','stock-out','unbox','price-change','delete','restore'].includes(operationType)||!['box','loose'].includes(inventoryKind)){skipped+=1;continue}
    const timestamp=excelDate(row['时间']); const snapshot={id:uid(),brand:brandName(row['品牌']),model:text(row['型号']),year:0,quantity:number(row['数量']),cabinet:'',customStickPrice:0,stockedAt:timestamp,createdAt:timestamp,updatedAt:timestamp} as LooseInventory
    operations.push({id:recordId,type:operationType,inventoryKind,inventoryId:snapshot.id,occurredAt:timestamp,createdAt:timestamp,quantity:number(row['数量'])||undefined,outboundReason:(text(row['出库原因'])||undefined) as OperationRecord['outboundReason'],beforePrice:number(row['修改前价格'])||undefined,afterPrice:number(row['修改后价格'])||undefined,note:text(row['备注'])||undefined,snapshot})
    existingOperationIds.add(recordId)
  }
  return { boxes, looseStocks, operations, skipped, warnings }
}

export async function applyImport(preview: ImportPreview): Promise<void> {
  // Vue wraps the preview in reactive proxies. IndexedDB cannot clone proxies,
  // so normalize the complete payload before entering the Dexie transaction.
  const payload = JSON.parse(JSON.stringify(preview)) as ImportPreview
  await db.transaction('rw',[db.boxes,db.looseStocks,db.operations],async()=>{
    await db.boxes.bulkAdd(payload.boxes)
    await db.looseStocks.bulkAdd(payload.looseStocks)
    await db.operations.bulkAdd(payload.operations)
  })
}

export async function exportWorkbook(): Promise<void> {
  const [boxes, looseStocks, operations] = await Promise.all([db.boxes.toArray(),db.looseStocks.toArray(),db.operations.toArray()])
  const workbook=XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(boxes.map((b)=>({'品牌':b.brand,'型号':b.model,'环径':b.ringGauge&&b.lengthMm?`${b.ringGauge}|${b.lengthMm}`:'','单盒价格':b.customBoxPrice,'单盒支数':b.sticksPerBox,'编号':b.serialNumber??'','年份':b.year,'来源':b.source??'','柜号':b.cabinet,'入库时间':b.stockedAt,'内部ID':b.id}))), '原盒')
  XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(looseStocks.map((s)=>({'品牌':s.brand,'型号':s.model,'单支价格':s.customStickPrice,'支数':s.quantity,'总价值':s.customStickPrice*s.quantity,'年份':s.year,'柜号':s.cabinet,'入库时间':s.stockedAt,'内部ID':s.id}))), '散支')
  XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(operations.map((o)=>({'类型':o.type,'库存类型':o.inventoryKind,'品牌':o.snapshot?.brand,'型号':o.snapshot?.model,'数量':o.quantity,'出库原因':o.outboundReason,'修改前价格':o.beforePrice,'修改后价格':o.afterPrice,'时间':o.occurredAt,'备注':o.note??'','记录ID':o.id}))), '操作记录')
  XLSX.writeFile(workbook,`cigar-manager-backup-${new Date().toISOString().slice(0,10)}.xlsx`)
  const timestamp = new Date().toISOString()
  await db.settings.put({ key: 'lastBackupAt', value: timestamp, updatedAt: timestamp })
}
