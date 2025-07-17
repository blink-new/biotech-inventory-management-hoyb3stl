import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { InventoryItem, InventoryTransaction, TransactionType } from '@/types/inventory'
import { blink } from '@/blink/client'
import { toast } from 'sonner'
import { mockInventoryItems } from '@/data/mockInventory'

interface InventoryContextType {
  items: InventoryItem[]
  transactions: InventoryTransaction[]
  loading: boolean
  addItem: (item: Omit<InventoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  updateQuantity: (id: string, newQuantity: number, reason?: string) => Promise<void>
  getItemById: (id: string) => InventoryItem | undefined
  getLowStockItems: () => InventoryItem[]
  getExpiringItems: (days?: number) => InventoryItem[]
  refreshData: () => Promise<void>
}

export const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      if (state.user && !state.isLoading) {
        await loadInventoryData()
      } else if (!state.user) {
        setItems([])
        setTransactions([])
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  const loadInventoryData = async () => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      // Load inventory items
      const inventoryItems = await blink.db.inventoryItems.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      // Load transactions
      const inventoryTransactions = await blink.db.inventoryTransactions.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 100
      })
      
      setItems(inventoryItems || [])
      setTransactions(inventoryTransactions || [])
    } catch (error) {
      console.error('Error loading inventory data:', error)
      // If no data exists yet, initialize with sample data for demo
      if (items.length === 0) {
        await initializeSampleData()
      }
    } finally {
      setLoading(false)
    }
  }

  const initializeSampleData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Add sample items for demo purposes
      const sampleItems = mockInventoryItems.map(item => ({
        ...item,
        userId: user.id,
        id: generateId()
      }))
      
      for (const item of sampleItems) {
        await blink.db.inventoryItems.create(item)
      }
      
      setItems(sampleItems)
      toast.success('Sample inventory data loaded!')
    } catch (error) {
      console.error('Error initializing sample data:', error)
    }
  }

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  const addItem = async (itemData: Omit<InventoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const user = await blink.auth.me()
      const newItem: InventoryItem = {
        ...itemData,
        id: generateId(),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Save to database
      await blink.db.inventoryItems.create(newItem)
      setItems(prev => [...prev, newItem])
      
      // Create transaction record
      const transaction: InventoryTransaction = {
        id: generateId(),
        itemId: newItem.id,
        transactionType: 'add',
        quantityChange: newItem.quantity,
        previousQuantity: 0,
        newQuantity: newItem.quantity,
        reason: 'Initial stock',
        performedBy: user.email || user.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      }
      
      await blink.db.inventoryTransactions.create(transaction)
      setTransactions(prev => [...prev, transaction])
      toast.success('Item added successfully!')
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
      throw error
    }
  }

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() }
      
      // Update in database
      await blink.db.inventoryItems.update(id, updatedData)
      
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, ...updatedData }
          : item
      ))
      toast.success('Item updated successfully!')
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
      throw error
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) throw new Error('Item not found')

      // Delete from database
      await blink.db.inventoryItems.delete(id)
      setItems(prev => prev.filter(item => item.id !== id))
      
      // Create transaction record
      const user = await blink.auth.me()
      const transaction: InventoryTransaction = {
        id: generateId(),
        itemId: id,
        transactionType: 'remove',
        quantityChange: -item.quantity,
        previousQuantity: item.quantity,
        newQuantity: 0,
        reason: 'Item deleted',
        performedBy: user.email || user.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      }
      
      await blink.db.inventoryTransactions.create(transaction)
      setTransactions(prev => [...prev, transaction])
      toast.success('Item deleted successfully!')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
      throw error
    }
  }

  const updateQuantity = async (id: string, newQuantity: number, reason = 'Manual adjustment') => {
    try {
      const item = items.find(i => i.id === id)
      if (!item) throw new Error('Item not found')

      const previousQuantity = item.quantity
      const quantityChange = newQuantity - previousQuantity
      const updatedAt = new Date().toISOString()

      // Update in database
      await blink.db.inventoryItems.update(id, { 
        quantity: newQuantity, 
        updatedAt 
      })

      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, quantity: newQuantity, updatedAt }
          : item
      ))

      // Create transaction record
      const user = await blink.auth.me()
      const transactionType: TransactionType = quantityChange > 0 ? 'add' : 
                                             quantityChange < 0 ? 'remove' : 'adjust'
      
      const transaction: InventoryTransaction = {
        id: generateId(),
        itemId: id,
        transactionType,
        quantityChange,
        previousQuantity,
        newQuantity,
        reason,
        performedBy: user.email || user.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      }
      
      await blink.db.inventoryTransactions.create(transaction)
      setTransactions(prev => [...prev, transaction])
      toast.success('Quantity updated successfully!')
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
      throw error
    }
  }

  const getItemById = (id: string) => {
    return items.find(item => item.id === id)
  }

  const getLowStockItems = () => {
    return items.filter(item => item.quantity <= item.minimumStockLevel)
  }

  const getExpiringItems = (days = 30) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)
    
    return items.filter(item => {
      if (!item.expirationDate) return false
      const expDate = new Date(item.expirationDate)
      return expDate <= cutoffDate
    })
  }

  const refreshData = async () => {
    await loadInventoryData()
    toast.success('Data refreshed!')
  }

  const value: InventoryContextType = {
    items,
    transactions,
    loading,
    addItem,
    updateItem,
    deleteItem,
    updateQuantity,
    getItemById,
    getLowStockItems,
    getExpiringItems,
    refreshData
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

