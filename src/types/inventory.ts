export type InventoryCategory = 
  | 'reagent'
  | 'diluent'
  | 'antibody_conjugate'
  | 'unconjugated_antibody'
  | 'calibrator'
  | 'reaction_kit'

export type TransactionType = 'add' | 'remove' | 'adjust' | 'transfer'

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  description?: string
  manufacturer?: string
  catalogNumber?: string
  lotNumber?: string
  quantity: number
  unit: string
  location?: string
  storageConditions?: string
  expirationDate?: string
  purchaseDate?: string
  costPerUnit?: number
  supplier?: string
  minimumStockLevel: number
  barcode?: string
  notes?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface InventoryTransaction {
  id: string
  itemId: string
  transactionType: TransactionType
  quantityChange: number
  previousQuantity: number
  newQuantity: number
  reason?: string
  performedBy: string
  userId: string
  createdAt: string
}

export interface StockAlert {
  itemId: string
  itemName: string
  currentQuantity: number
  minimumLevel: number
  alertType: 'low_stock' | 'expired' | 'expiring_soon'
  expirationDate?: string
}

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  reagent: 'Reagents',
  diluent: 'Diluents',
  antibody_conjugate: 'Antibody Conjugates',
  unconjugated_antibody: 'Unconjugated Antibodies',
  calibrator: 'Calibrators',
  reaction_kit: 'Reaction Kits'
}

export const CATEGORY_COLORS: Record<InventoryCategory, string> = {
  reagent: 'bg-blue-100 text-blue-800',
  diluent: 'bg-green-100 text-green-800',
  antibody_conjugate: 'bg-purple-100 text-purple-800',
  unconjugated_antibody: 'bg-orange-100 text-orange-800',
  calibrator: 'bg-yellow-100 text-yellow-800',
  reaction_kit: 'bg-red-100 text-red-800'
}