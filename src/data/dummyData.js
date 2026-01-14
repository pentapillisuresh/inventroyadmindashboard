export const initialStores = [
  {
    id: 1,
    name: "Downtown Store",
    address: "123 Main Street, New York, NY 10001",
    status: "Active",
    manager: "John Smith",
    phone: "+1 (555) 123-4567",
    totalProducts: 245,
    totalValue: "$125K",
    capacity: "5000 sq ft",
    stockValue: "$45,200",
    totalItems: 1245,
    infrastructure: [
      { name: "Storage Room A", capacity: "1000 sq ft", items: 245 },
      { name: "Storage Room B", capacity: "800 sq ft", items: 189 },
      { name: "Cold Storage", capacity: "600 sq ft", items: 156 }
    ],
    racks: [
      { name: "Rack A1", location: "Room A", items: "45 / 50" },
      { name: "Rack A2", location: "Room A", items: "48 / 50" },
      { name: "Rack B1", location: "Room B", items: "35 / 40" }
    ],
    freezers: [
      { name: "Freezer 1", temp: "-18°C", capacity: "200 cu ft", items: 78 },
      { name: "Freezer 2", temp: "-20°C", capacity: "150 cu ft", items: 56 }
    ]
  },
  {
    id: 2,
    name: "Westside Outlet",
    address: "456 West Avenue, Los Angeles, CA 90001",
    status: "Active",
    manager: "Sarah Johnson",
    phone: "+1 (555) 234-5678",
    totalProducts: 198,
    totalValue: "$98K",
    capacity: "3500 sq ft",
    stockValue: "$38,500",
    totalItems: 987
  },
  {
    id: 3,
    name: "Central Plaza",
    address: "789 Central Road, Chicago, IL 60601",
    status: "Active",
    manager: "Mike Davis",
    phone: "+1 (555) 345-6789",
    totalProducts: 312,
    totalValue: "$156K",
    capacity: "6000 sq ft",
    stockValue: "$58,900",
    totalItems: 1543
  }
];

export const initialOutlets = [
  {
    id: 1,
    name: "Downtown Store",
    type: "Official",
    phone: "+1 (555) 123-4567",
    creditUsed: 12500,
    creditLimit: 15000,
    lastOrder: "2024-01-15",
    totalOrders: 145,
    status: "Active",
    dueDate: "2024-01-20"
  },
  {
    id: 2,
    name: "Westside Outlet",
    type: "Official",
    phone: "+1 (555) 234-5678",
    creditUsed: 8200,
    creditLimit: 10000,
    lastOrder: "2024-01-14",
    totalOrders: 98,
    status: "Active",
    dueDate: "2024-01-18"
  }
];

export const pendingApprovals = [
  {
    id: "INV-2024-001",
    store: "Downtown Store",
    manager: "John Smith",
    items: 15,
    date: "2024-01-15"
  },
  {
    id: "INV-2024-002",
    store: "Westside Outlet",
    manager: "Sarah Johnson",
    items: 12,
    date: "2024-01-15"
  },
  {
    id: "INV-2024-003",
    store: "Central Plaza",
    manager: "Mike Davis",
    items: 20,
    date: "2024-01-14"
  }
];

export const creditDues = [
  {
    id: 1,
    store: "Downtown Store",
    dueDate: "2024-01-20",
    creditUsed: 12500,
    creditLimit: 15000
  },
  {
    id: 2,
    store: "Westside Outlet",
    dueDate: "2024-01-18",
    creditUsed: 8200,
    creditLimit: 10000
  },
  {
    id: 3,
    store: "Central Plaza",
    dueDate: "2024-01-15",
    creditUsed: 15000,
    creditLimit: 15000
  }
];

export const stockAlerts = [
  {
    id: 1,
    name: "Premium Coffee Beans",
    store: "Downtown Store",
    sku: "PCB-001",
    current: 45,
    min: 100
  },
  {
    id: 2,
    name: "Organic Tea Leaves",
    store: "Westside Outlet",
    sku: "OTL-002",
    current: 78,
    min: 150
  },
  {
    id: 3,
    name: "Chocolate Bars",
    store: "Central Plaza",
    sku: "CHB-003",
    current: 120,
    min: 200
  }
];

export const recentActivities = [
  {
    id: 1,
    action: "Invoice INV-2024-001 approved",
    user: "Admin",
    time: "5 minutes ago"
  },
  {
    id: 2,
    action: "Stock distributed to Downtown Store",
    user: "Admin",
    time: "15 minutes ago"
  },
  {
    id: 3,
    action: "New manager created: Emily Brown",
    user: "Admin",
    time: "1 hour ago"
  }
];

export const adminCredentials = {
  username: "admin",
  password: "admin123"
};