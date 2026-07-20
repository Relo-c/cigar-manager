import { db } from '../db/database'
import type {
  BoxInventory,
  InventoryKind,
  LooseInventory,
  OperationRecord,
  OutboundReason,
  OutboundUnit
} from '../types/inventory'

export type BoxInput = Omit<BoxInventory, 'id' | 'createdAt' | 'updatedAt'>
export type LooseInput = Omit<LooseInventory, 'id' | 'createdAt' | 'updatedAt'>

function id(): string {
  return crypto.randomUUID()
}

function operation(
  type: OperationRecord['type'],
  inventoryKind: InventoryKind,
  inventoryId: string,
  snapshot: BoxInventory | LooseInventory,
  extras: Partial<OperationRecord> = {}
): OperationRecord {
  const now = new Date().toISOString()
  const storedSnapshot = { ...snapshot } as BoxInventory | LooseInventory
  return {
    id: id(),
    type,
    inventoryKind,
    inventoryId,
    occurredAt: now,
    createdAt: now,
    snapshot: storedSnapshot,
    ...extras
  }
}

export async function createBox(input: BoxInput): Promise<BoxInventory> {
  const now = new Date().toISOString()
  const box: BoxInventory = { ...input, id: id(), createdAt: now, updatedAt: now }
  await db.transaction('rw', [db.boxes, db.operations], async () => {
    await db.boxes.add(box)
    await db.operations.add(operation('stock-in', 'box', box.id, box, { quantity: 1 }))
  })
  return box
}

export async function updateBox(
  current: BoxInventory,
  input: BoxInput
): Promise<BoxInventory> {
  const updated: BoxInventory = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString()
  }
  await db.transaction('rw', [db.boxes, db.operations], async () => {
    await db.boxes.put(updated)
    if (current.customBoxPrice !== updated.customBoxPrice) {
      await db.operations.add(
        operation('price-change', 'box', updated.id, updated, {
          beforePrice: current.customBoxPrice,
          afterPrice: updated.customBoxPrice
        })
      )
    }
  })
  return updated
}

export async function deleteBox(box: BoxInventory): Promise<void> {
  await db.transaction('rw', [db.boxes, db.operations], async () => {
    await db.boxes.delete(box.id)
    await db.operations.add(operation('delete', 'box', box.id, box, { quantity: 1 }))
  })
}

export async function createOrMergeLoose(input: LooseInput): Promise<LooseInventory> {
  return db.transaction('rw', [db.looseStocks, db.operations], async () => {
    const existing = await db.looseStocks
      .where('[brand+model+year+cabinet]')
      .equals([input.brand, input.model, input.year, input.cabinet])
      .first()
    const now = new Date().toISOString()

    if (existing) {
      const merged: LooseInventory = {
        ...existing,
        quantity: existing.quantity + input.quantity,
        updatedAt: now
      }
      await db.looseStocks.put(merged)
      await db.operations.add(
        operation('stock-in', 'loose', merged.id, merged, { quantity: input.quantity })
      )
      return merged
    }

    const stock: LooseInventory = { ...input, id: id(), createdAt: now, updatedAt: now }
    await db.looseStocks.add(stock)
    await db.operations.add(
      operation('stock-in', 'loose', stock.id, stock, { quantity: stock.quantity })
    )
    return stock
  })
}

export async function updateLoose(
  current: LooseInventory,
  input: LooseInput
): Promise<LooseInventory> {
  const updated: LooseInventory = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString()
  }
  await db.transaction('rw', [db.looseStocks, db.operations], async () => {
    await db.looseStocks.put(updated)
    if (current.customStickPrice !== updated.customStickPrice) {
      await db.operations.add(
        operation('price-change', 'loose', updated.id, updated, {
          beforePrice: current.customStickPrice,
          afterPrice: updated.customStickPrice
        })
      )
    }
  })
  return updated
}

export async function deleteLoose(stock: LooseInventory): Promise<void> {
  await db.transaction('rw', [db.looseStocks, db.operations], async () => {
    await db.looseStocks.delete(stock.id)
    await db.operations.add(
      operation('delete', 'loose', stock.id, stock, { quantity: stock.quantity })
    )
  })
}

export async function unboxInventory(
  box: BoxInventory,
  customStickPrice: number
): Promise<LooseInventory> {
  return db.transaction(
    'rw',
    [db.boxes, db.looseStocks, db.operations],
    async () => {
      const existing = await db.looseStocks
        .where('[brand+model+year+cabinet]')
        .equals([box.brand, box.model, box.year, box.cabinet])
        .first()
      const now = new Date().toISOString()
      let loose: LooseInventory

      if (existing) {
        loose = {
          ...existing,
          quantity: existing.quantity + box.sticksPerBox,
          updatedAt: now
        }
        await db.looseStocks.put(loose)
      } else {
        loose = {
          id: id(),
          brand: box.brand,
          model: box.model,
          year: box.year,
          quantity: box.sticksPerBox,
          cabinet: box.cabinet,
          customStickPrice,
          stockedAt: now,
          createdAt: now,
          updatedAt: now
        }
        await db.looseStocks.add(loose)
      }

      await db.boxes.delete(box.id)
      await db.operations.add(
        operation('unbox', 'box', box.id, box, {
          quantity: box.sticksPerBox,
          relatedInventoryId: loose.id,
          afterPrice: existing?.customStickPrice ?? customStickPrice
        })
      )
      return loose
    }
  )
}

export async function outboundBox(
  box: BoxInventory,
  quantity: number,
  unit: OutboundUnit,
  reason: OutboundReason,
  occurredAt: string,
  note?: string
): Promise<void> {
  if (unit === 'box') {
    await db.transaction('rw', [db.boxes, db.operations], async () => {
      await db.boxes.delete(box.id)
      await db.operations.add(
        operation('stock-out', 'box', box.id, box, {
          quantity: 1,
          outboundReason: reason,
          occurredAt,
          note
        })
      )
    })
    return
  }

  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > box.sticksPerBox) {
    throw new Error('出库支数无效')
  }

  await db.transaction('rw', [db.boxes, db.looseStocks, db.operations], async () => {
    const now = new Date().toISOString()
    const stickPrice = box.customBoxPrice / box.sticksPerBox
    const remainingQuantity = box.sticksPerBox - quantity
    const existing = remainingQuantity > 0
      ? await db.looseStocks
          .where('[brand+model+year+cabinet]')
          .equals([box.brand, box.model, box.year, box.cabinet])
          .first()
      : undefined
    let loose: LooseInventory | undefined

    if (remainingQuantity > 0) {
      loose = existing
        ? { ...existing, quantity: existing.quantity + remainingQuantity, updatedAt: now }
        : {
            id: id(),
            brand: box.brand,
            model: box.model,
            year: box.year,
            quantity: remainingQuantity,
            cabinet: box.cabinet,
            customStickPrice: stickPrice,
            stockedAt: now,
            createdAt: now,
            updatedAt: now
          }
      await db.looseStocks.put(loose)
    }

    const outboundSnapshot: LooseInventory = {
      id: loose?.id ?? box.id,
      brand: box.brand,
      model: box.model,
      year: box.year,
      quantity: box.sticksPerBox,
      cabinet: box.cabinet,
      customStickPrice: existing?.customStickPrice ?? stickPrice,
      stockedAt: box.stockedAt,
      createdAt: box.createdAt,
      updatedAt: now
    }

    await db.boxes.delete(box.id)
    await db.operations.add(
      operation('unbox', 'box', box.id, box, {
        quantity: box.sticksPerBox,
        relatedInventoryId: loose?.id,
        afterPrice: outboundSnapshot.customStickPrice,
        note: '按支出库自动拆盒'
      })
    )
    await db.operations.add(
      operation('stock-out', 'loose', outboundSnapshot.id, outboundSnapshot, {
        quantity,
        outboundReason: reason,
        occurredAt,
        note
      })
    )
  })
}

export async function outboundLoose(
  stock: LooseInventory,
  quantity: number,
  reason: OutboundReason,
  occurredAt: string,
  note?: string
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > stock.quantity) {
    throw new Error('出库支数无效')
  }
  await db.transaction('rw', [db.looseStocks, db.operations], async () => {
    if (quantity === stock.quantity) {
      await db.looseStocks.delete(stock.id)
    } else {
      await db.looseStocks.update(stock.id, {
        quantity: stock.quantity - quantity,
        updatedAt: new Date().toISOString()
      })
    }
    await db.operations.add(
      operation('stock-out', 'loose', stock.id, stock, {
        quantity,
        outboundReason: reason,
        occurredAt,
        note
      })
    )
  })
}
