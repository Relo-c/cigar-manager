import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSetting,
  BoxInventory,
  LooseInventory,
  OperationRecord
} from '../types/inventory'

class CigarManagerDatabase extends Dexie {
  boxes!: EntityTable<BoxInventory, 'id'>
  looseStocks!: EntityTable<LooseInventory, 'id'>
  operations!: EntityTable<OperationRecord, 'id'>
  settings!: EntityTable<AppSetting, 'key'>

  constructor() {
    super('cigar-manager')

    this.version(1).stores({
      boxes: 'id, brand, model, year, cabinet, stockedAt, updatedAt',
      looseStocks:
        'id, brand, model, year, cabinet, [brand+model+year+cabinet], stockedAt, updatedAt',
      operations: 'id, type, inventoryKind, inventoryId, occurredAt, createdAt',
      settings: 'key, updatedAt'
    })
  }
}

export const db = new CigarManagerDatabase()

export async function clearLocalData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.boxes, db.looseStocks, db.operations, db.settings],
    async () => {
      await Promise.all([
        db.boxes.clear(),
        db.looseStocks.clear(),
        db.operations.clear(),
        db.settings.clear()
      ])
    }
  )
}
