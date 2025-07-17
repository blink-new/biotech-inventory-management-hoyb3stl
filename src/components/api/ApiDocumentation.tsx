import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, 
  Copy, 
  Key, 
  Book, 
  Terminal,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

const pythonExamples = {
  setup: `# Install required packages
pip install requests pandas

# Import libraries
import requests
import pandas as pd
from datetime import datetime

# Configuration
API_BASE_URL = "https://api.bioinventory.com/v1"
API_KEY = "your_api_key_here"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}`,

  listItems: `# Get all inventory items
def get_inventory_items(category=None, limit=100):
    url = f"{API_BASE_URL}/inventory"
    params = {"limit": limit}
    
    if category:
        params["category"] = category
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Example usage
items = get_inventory_items(category="antibody_conjugate")
print(f"Found {len(items['data'])} items")`,

  addItem: `# Add a new inventory item
def add_inventory_item(item_data):
    url = f"{API_BASE_URL}/inventory"
    
    response = requests.post(url, headers=headers, json=item_data)
    
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Example usage
new_item = {
    "name": "Anti-CD4 Antibody",
    "category": "antibody_conjugate",
    "manufacturer": "BioLegend",
    "catalog_number": "300512",
    "quantity": 50,
    "unit": "tests",
    "minimum_stock_level": 10,
    "storage_conditions": "-20°C",
    "expiration_date": "2024-12-31"
}

result = add_inventory_item(new_item)
print(f"Added item with ID: {result['id']}")`,

  updateStock: `# Update item quantity
def update_item_quantity(item_id, new_quantity, reason="Manual adjustment"):
    url = f"{API_BASE_URL}/inventory/{item_id}/quantity"
    
    data = {
        "quantity": new_quantity,
        "reason": reason
    }
    
    response = requests.patch(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Example usage
result = update_item_quantity("item_123", 25, "Used in experiment")
print(f"Updated quantity to {result['quantity']}")`,

  lowStock: `# Get low stock alerts
def get_low_stock_alerts():
    url = f"{API_BASE_URL}/alerts/low-stock"
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        alerts = response.json()
        
        # Convert to DataFrame for easy analysis
        df = pd.DataFrame(alerts['data'])
        
        print(f"Found {len(df)} items with low stock:")
        print(df[['name', 'current_quantity', 'minimum_level']])
        
        return df
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# Example usage
low_stock_df = get_low_stock_alerts()`,

  analytics: `# Generate inventory analytics
def generate_inventory_report():
    # Get all items
    items = get_inventory_items()
    df = pd.DataFrame(items['data'])
    
    # Category distribution
    category_counts = df['category'].value_counts()
    print("\\nCategory Distribution:")
    print(category_counts)
    
    # Total inventory value
    df['total_value'] = df['quantity'] * df['cost_per_unit'].fillna(0)
    total_value = df['total_value'].sum()
    print(f"\\nTotal Inventory Value: ${total_value:,.2f}")
    
    # Expiring items (next 30 days)
    df['expiration_date'] = pd.to_datetime(df['expiration_date'])
    today = datetime.now()
    expiring_soon = df[
        (df['expiration_date'] - today).dt.days <= 30
    ]
    
    print(f"\\nItems expiring in 30 days: {len(expiring_soon)}")
    
    return {
        'category_counts': category_counts.to_dict(),
        'total_value': total_value,
        'expiring_items': expiring_soon[['name', 'expiration_date']].to_dict('records')
    }

# Example usage
report = generate_inventory_report()`
}

const apiEndpoints = [
  {
    method: 'GET',
    endpoint: '/inventory',
    description: 'List all inventory items',
    parameters: ['category', 'limit', 'offset', 'search']
  },
  {
    method: 'POST',
    endpoint: '/inventory',
    description: 'Add a new inventory item',
    parameters: ['name', 'category', 'quantity', 'unit']
  },
  {
    method: 'GET',
    endpoint: '/inventory/{id}',
    description: 'Get specific inventory item',
    parameters: ['id']
  },
  {
    method: 'PATCH',
    endpoint: '/inventory/{id}',
    description: 'Update inventory item',
    parameters: ['id', 'fields to update']
  },
  {
    method: 'DELETE',
    endpoint: '/inventory/{id}',
    description: 'Delete inventory item',
    parameters: ['id']
  },
  {
    method: 'PATCH',
    endpoint: '/inventory/{id}/quantity',
    description: 'Update item quantity',
    parameters: ['id', 'quantity', 'reason']
  },
  {
    method: 'GET',
    endpoint: '/alerts/low-stock',
    description: 'Get low stock alerts',
    parameters: ['category']
  },
  {
    method: 'GET',
    endpoint: '/alerts/expiring',
    description: 'Get expiring items',
    parameters: ['days']
  },
  {
    method: 'GET',
    endpoint: '/transactions',
    description: 'Get transaction history',
    parameters: ['item_id', 'limit', 'offset']
  }
]

const quickStartCode = `import requests

API_KEY = "your_api_key_here"
headers = {"Authorization": f"Bearer {API_KEY}"}

response = requests.get(
    "https://api.bioinventory.com/v1/inventory",
    headers=headers
)

items = response.json()
print(f"Found {len(items['data'])} items")`

export function ApiDocumentation() {
  const [apiKey, setApiKey] = useState('bio_inv_1234567890abcdef')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const generateApiKey = () => {
    const newKey = 'bio_inv_' + Math.random().toString(36).substring(2, 18)
    setApiKey(newKey)
    toast.success('New API key generated!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground">
          Programmatic access to your biotech inventory system
        </p>
      </div>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>
            Generate and manage your API keys for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={apiKey}
              readOnly
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(apiKey)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={generateApiKey}>
              Generate New Key
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Keep your API key secure and never share it publicly</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="python" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="python">Python Examples</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
        </TabsList>

        {/* Python Examples */}
        <TabsContent value="python" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Python Integration Examples
              </CardTitle>
              <CardDescription>
                Ready-to-use Python code for common inventory operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(pythonExamples).map(([key, code]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{code}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Endpoints */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                API Endpoints Reference
              </CardTitle>
              <CardDescription>
                Complete list of available API endpoints and their parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={endpoint.method === 'GET' ? 'default' : 
                                endpoint.method === 'POST' ? 'secondary' :
                                endpoint.method === 'PATCH' ? 'outline' : 'destructive'}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.parameters.map((param) => (
                        <Badge key={param} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Start */}
        <TabsContent value="quickstart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Get started with the BioInventory API in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Get Your API Key</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate an API key from the section above. Keep it secure!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Install Dependencies</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Install the required Python packages:
                    </p>
                    <code className="bg-muted p-2 rounded text-sm block">
                      pip install requests pandas
                    </code>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Make Your First Request</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Try fetching your inventory items:
                    </p>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      <code>{quickStartCode}</code>
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Explore Examples</h3>
                    <p className="text-sm text-muted-foreground">
                      Check out the Python Examples tab for more advanced use cases including analytics, stock management, and automated alerts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Additional Resources</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full API Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download Python SDK
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Developer Community
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}