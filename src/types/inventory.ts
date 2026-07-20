export type InventoryKind = 'box' | 'loose'

export type OperationType =
  | 'stock-in'
  | 'stock-out'
  | 'unbox'
  | 'price-change'
  | 'delete'
  | 'restore'

export type OutboundReason = 'self-use' | 'gift' | 'sale' | 'other'

export type OutboundUnit = 'box' | 'stick'

export interface BoxInventory {
  id: string
  brand: string
  model: string
  year: number
  sticksPerBox: number
  cabinet: string
  customBoxPrice: number
  serialNumber?: string
  source?: string
  ringGauge?: number
  lengthMm?: number
  stockedAt: string
  createdAt: string
  updatedAt: string
}

export interface LooseInventory {
  id: string
  brand: string
  model: string
  year: number
  quantity: number
  cabinet: string
  customStickPrice: number
  stockedAt: string
  createdAt: string
  updatedAt: string
}

export interface OperationRecord {
  id: string
  type: OperationType
  inventoryKind: InventoryKind
  inventoryId: string
  occurredAt: string
  createdAt: string
  quantity?: number
  outboundReason?: OutboundReason
  note?: string
  beforePrice?: number
  afterPrice?: number
  snapshot?: BoxInventory | LooseInventory
  relatedInventoryId?: string
}

export interface AppSetting {
  key: string
  value: unknown
  updatedAt: string
}
