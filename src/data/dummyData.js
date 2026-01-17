export const initialStores = [
  {
    id: 1,
    name: "Visakhapatnam Store",
    address: "123 Beach Road, Visakhapatnam, AP 530001",
    status: "Active",
    manager: "Rajesh Kumar",
    phone: "+91 9876543210",
    totalProducts: 245,
    totalValue: "₹125K",
    capacity: "5000 sq ft",
    stockValue: "₹45,200",
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
    name: "Vijayawada Outlet",
    address: "456 Prakasam Road, Vijayawada, AP 520001",
    status: "Active",
    manager: "Priya Sharma",
    phone: "+91 8765432109",
    totalProducts: 198,
    totalValue: "₹98K",
    capacity: "3500 sq ft",
    stockValue: "₹38,500",
    totalItems: 987
  },
  {
    id: 3,
    name: "Guntur Plaza",
    address: "789 Market Street, Guntur, AP 522001",
    status: "Active",
    manager: "Suresh Reddy",
    phone: "+91 7654321098",
    totalProducts: 312,
    totalValue: "₹156K",
    capacity: "6000 sq ft",
    stockValue: "₹58,900",
    totalItems: 1543
  }
];

export const initialOutlets = [
  {
    id: 1,
    name: "Visakhapatnam Store",
    type: "Official",
    phone: "+91 9876543210",
    creditUsed: 12500,
    creditLimit: 15000,
    lastOrder: "2024-01-15",
    totalOrders: 145,
    status: "Active",
    dueDate: "2024-01-20"
  },
  {
    id: 2,
    name: "Vijayawada Outlet",
    type: "Official",
    phone: "+91 8765432109",
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
    store: "Visakhapatnam Store",
    manager: "Rajesh Kumar",
    items: 15,
    date: "2024-01-15"
  },
  {
    id: "INV-2024-002",
    store: "Vijayawada Outlet",
    manager: "Priya Sharma",
    items: 12,
    date: "2024-01-15"
  },
  {
    id: "INV-2024-003",
    store: "Guntur Plaza",
    manager: "Suresh Reddy",
    items: 20,
    date: "2024-01-14"
  }
];

export const creditDues = [
  {
    id: 1,
    store: "Visakhapatnam Store",
    dueDate: "2024-01-20",
    creditUsed: 12500,
    creditLimit: 15000
  },
  {
    id: 2,
    store: "Vijayawada Outlet",
    dueDate: "2024-01-18",
    creditUsed: 8200,
    creditLimit: 10000
  },
  {
    id: 3,
    store: "Guntur Plaza",
    dueDate: "2024-01-15",
    creditUsed: 15000,
    creditLimit: 15000
  }
];

export const stockAlerts = [
  {
    id: 1,
    name: "Premium Coffee Beans",
    store: "Visakhapatnam Store",
    sku: "PCB-001",
    current: 45,
    min: 100
  },
  {
    id: 2,
    name: "Organic Tea Leaves",
    store: "Vijayawada Outlet",
    sku: "OTL-002",
    current: 78,
    min: 150
  },
  {
    id: 3,
    name: "Chocolate Bars",
    store: "Guntur Plaza",
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
    action: "Stock distributed to Visakhapatnam Store",
    user: "Admin",
    time: "15 minutes ago"
  },
  {
    id: 3,
    action: "New manager created: Kavitha Naidu",
    user: "Admin",
    time: "1 hour ago"
  }
];

export const adminCredentials = {
  username: "admin",
  password: "admin123"
};