import { useState } from 'react'
import { useInventory } from '@/hooks/useInventory'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Calendar,
  Package
} from 'lucide-react'
import { CATEGORY_LABELS, CATEGORY_COLORS, type InventoryCategory, type InventoryItem } from '@/types/inventory'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface InventoryTableProps {
  onEditItem?: (item: InventoryItem) => void
  onDeleteItem?: (itemId: string) => void
}

export function InventoryTable({ onEditItem, onDeleteItem }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [quantityDialogItem, setQuantityDialogItem] = useState<InventoryItem | null>(null)
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [quantityReason, setQuantityReason] = useState('')
  
  const { items, loading, deleteItem, updateQuantity } = useInventory()

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.catalogNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.minimumStockLevel) {
      return { status: 'low', color: 'text-orange-600', icon: AlertTriangle }
    }
    return { status: 'normal', color: 'text-green-600', icon: Package }
  }

  const getExpirationStatus = (expirationDate?: string) => {
    if (!expirationDate) return null
    
    const expDate = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', color: 'text-red-600', text: 'Expired' }
    } else if (daysUntilExpiration <= 30) {
      return { status: 'expiring', color: 'text-orange-600', text: `${daysUntilExpiration}d` }
    }
    return { status: 'good', color: 'text-green-600', text: `${daysUntilExpiration}d` }
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    onEditItem?.(item)
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId)
      setDeletingItemId(null)
      onDeleteItem?.(itemId)
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleQuantityUpdate = async () => {
    if (!quantityDialogItem) return
    
    try {
      await updateQuantity(quantityDialogItem.id, newQuantity, quantityReason || 'Manual adjustment')
      setQuantityDialogItem(null)
      setNewQuantity(0)
      setQuantityReason('')
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const openQuantityDialog = (item: InventoryItem) => {
    setQuantityDialogItem(item)
    setNewQuantity(item.quantity)
    setQuantityReason('')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your biotech laboratory inventory
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage your biotech laboratory inventory
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find and filter inventory items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, catalog number, or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {items.length} items
        </p>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item)
                  const expirationStatus = getExpirationStatus(item.expirationDate)
                  const StockIcon = stockStatus.icon

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{item.manufacturer}</span>
                            {item.catalogNumber && (
                              <>
                                <span>•</span>
                                <span>{item.catalogNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={CATEGORY_COLORS[item.category]}>
                          {CATEGORY_LABELS[item.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{item.quantity} {item.unit}</p>
                          <p className="text-xs text-muted-foreground">
                            Min: {item.minimumStockLevel}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{item.location || 'Not specified'}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.storageConditions}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {expirationStatus ? (
                          <div className={`flex items-center gap-1 ${expirationStatus.color}`}>
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {expirationStatus.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${stockStatus.color}`}>
                          <StockIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">
                            {stockStatus.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openQuantityDialog(item)}
                            title="Update quantity"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditItem(item)}
                            title="Edit item"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingItemId(item.id)}
                            title="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first inventory item'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quantity Update Dialog */}
      <Dialog open={!!quantityDialogItem} onOpenChange={() => setQuantityDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quantity</DialogTitle>
            <DialogDescription>
              Update the quantity for {quantityDialogItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Quantity</label>
              <p className="text-sm text-muted-foreground">
                {quantityDialogItem?.quantity} {quantityDialogItem?.unit}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">New Quantity</label>
              <Input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                min="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                value={quantityReason}
                onChange={(e) => setQuantityReason(e.target.value)}
                placeholder="e.g., Used in experiment, Received shipment"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuantityDialogItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleQuantityUpdate}>
              Update Quantity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItemId && handleDeleteItem(deletingItemId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}