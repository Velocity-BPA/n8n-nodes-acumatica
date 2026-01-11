# n8n-nodes-acumatica

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Acumatica Cloud ERP that enables workflow automation for sales orders, customers, inventory, invoicing, purchasing, and financial operations through the Contract-Based REST API.

![n8n](https://img.shields.io/badge/n8n-community--node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

## Features

- **12 Resource Categories** with 100+ operations for complete ERP automation
- **OAuth 2.0 Authentication** with automatic token refresh
- **Push Notification Trigger** for real-time event-driven workflows
- **OData Pagination** for efficient data retrieval
- **Multi-Company Support** for multi-tenant instances
- **Branch Context** for multi-branch operations

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Select **Install**
4. Enter `n8n-nodes-acumatica` in the search field
5. Agree to the risks and click **Install**

### Manual Installation

```bash
# Navigate to n8n installation directory
cd ~/.n8n

# Install the node
npm install n8n-nodes-acumatica
```

### Development Installation

```bash
# Clone or extract the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-acumatica.git
cd n8n-nodes-acumatica

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-acumatica

# Restart n8n
n8n start
```

## Credentials Setup

### Acumatica OAuth2 API

| Parameter | Required | Description |
|-----------|----------|-------------|
| Instance URL | Yes | Full URL of your Acumatica instance (e.g., `https://mycompany.acumatica.com`) |
| API Version | Yes | API version (default: `24.200.001`) |
| Client ID | Yes | OAuth Client ID from Connected Applications (SM303010) |
| Client Secret | Yes | OAuth Client Secret |
| Username | Yes | API user username |
| Password | Yes | API user password |
| Company Name | No | Company/Tenant name for multi-tenant instances |
| Branch ID | No | Branch ID for multi-branch operations |

### Setting up OAuth in Acumatica

1. Navigate to **Connected Applications** (SM303010) in Acumatica
2. Create a new application with OAuth 2.0 Resource Owner Password flow
3. Copy the Client ID and generate a Client Secret
4. Assign the appropriate API user role to the application

## Resources & Operations

### Customer
Manage AR Customers with full CRUD operations plus contact and location management.
- Create, Get, Get Many, Update, Delete
- Get Contacts, Add Contact
- Get Locations, Add Location
- Get Open Balances

### Sales Order
Complete sales order lifecycle management from creation to fulfillment.
- Create, Get, Get Many, Update, Delete
- Add Line, Update Line, Delete Line
- Get Shipments, Create Shipment
- Hold Order, Remove Hold, Cancel Order

### Item (Stock Item)
Inventory management with warehouse and vendor details.
- Create, Get, Get Many, Update, Delete
- Get Availability
- Get Warehouses
- Get Vendor Details

### Invoice
AR Invoice management with release and payment application.
- Create, Get, Get Many, Update, Delete
- Add Line
- Release
- Get Applications, Get Balance

### Vendor
AP Vendor management with contact information.
- Create, Get, Get Many, Update, Delete
- Get Contacts, Add Contact
- Get Open Balance

### Purchase Order
Procurement lifecycle from requisition to receipt.
- Create, Get, Get Many, Update, Delete
- Add Line
- Email to Vendor
- Get Receipts

### Payment
AR Payment processing and application.
- Create, Get, Get Many, Update, Delete
- Release, Void
- Get Applications
- Apply to Document, Remove Application

### Bill
AP Bill management and payment scheduling.
- Create, Get, Get Many, Update, Delete
- Add Line, Update Line, Delete Line
- Release
- Get Applications
- Schedule Payment

### Journal Transaction
GL Journal entry management.
- Create, Get, Get Many, Update, Delete
- Add Line, Update Line, Delete Line
- Release, Reverse

### Shipment
Shipping and fulfillment operations.
- Create, Get, Get Many, Update, Delete
- Confirm Shipment, Correct Shipment
- Get Packages, Add Package
- Create Invoice
- Get Tracking Info

### Generic Inquiry
Execute custom generic inquiries for reporting.
- Execute
- Get Schema
- List Available Inquiries

### Business Account
CRM Business Account management with conversion.
- Create, Get, Get Many, Update, Delete
- Get Contacts, Get Opportunities, Get Cases, Get Activities
- Convert to Customer or Vendor

## Trigger Node

The Acumatica Trigger node enables real-time workflow automation through Acumatica Push Notifications.

### Supported Events

| Event | Description |
|-------|-------------|
| customer.created | New customer created |
| customer.updated | Customer record updated |
| salesOrder.created | New sales order created |
| salesOrder.updated | Sales order modified |
| salesOrder.shipped | Sales order shipped |
| invoice.created | Invoice generated |
| invoice.released | Invoice released/posted |
| payment.received | Payment received |
| shipment.confirmed | Shipment confirmed |
| item.updated | Stock item updated |
| vendor.created | New vendor created |
| purchaseOrder.created | PO created |
| bill.created | Vendor bill created |

### Push Notification Setup

1. Navigate to **Push Notifications** (SM302000) in Acumatica
2. Create a new Push Notification destination
3. Set the webhook URL from the n8n trigger node
4. Configure the query to monitor the relevant entity
5. Save and activate the notification

## Usage Examples

### Create a Sales Order

```javascript
// Input data
{
  "resource": "salesOrder",
  "operation": "create",
  "orderType": "SO",
  "customerId": "CUST001",
  "requestedOn": "2024-02-01",
  "lineItems": [
    {
      "inventoryId": "ITEM001",
      "quantity": 10,
      "unitPrice": 99.99
    }
  ]
}
```

### Get Customer Open Balances

```javascript
// Input data
{
  "resource": "customer",
  "operation": "getOpenBalances",
  "customerId": "CUST001"
}
```

### Execute Generic Inquiry

```javascript
// Input data
{
  "resource": "genericInquiry",
  "operation": "execute",
  "inquiryName": "AR-Aging",
  "parameters": {
    "AsOfDate": "2024-01-31"
  }
}
```

## Acumatica API Concepts

### Value Wrapper Format
Acumatica API returns values in a wrapper format:
```json
{
  "CustomerID": { "value": "CUST001" },
  "CustomerName": { "value": "Test Customer" }
}
```
The node automatically simplifies this to:
```json
{
  "CustomerID": "CUST001",
  "CustomerName": "Test Customer"
}
```

### OData Query Parameters
- `$top`: Maximum records to return (max 500)
- `$skip`: Records to skip for pagination
- `$filter`: OData filter expressions
- `$select`: Fields to return
- `$expand`: Related entities to include
- `$orderby`: Sort order

### API Versions
Supported versions: `20.200.001`, `22.200.001`, `23.200.001`, `24.200.001`

## Error Handling

The node provides detailed error messages for common scenarios:

| Error Code | Description |
|------------|-------------|
| 400 | Invalid request parameters |
| 401 | Authentication failed - check credentials |
| 403 | Insufficient permissions |
| 404 | Entity not found |
| 409 | Concurrent modification conflict |
| 429 | Rate limit exceeded - reduce request frequency |
| 500 | Server error - check Acumatica logs |

## Security Best Practices

1. **Use dedicated API users** - Create service accounts for n8n integrations
2. **Limit permissions** - Grant only necessary API roles
3. **Rotate credentials** - Regularly update OAuth secrets
4. **Use HTTPS** - Always connect via secure URLs
5. **Monitor API usage** - Review API logs for unusual activity

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Fix lint issues
npm run lint:fix
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [Acumatica API Documentation](https://help.acumatica.com/Help?ScreenId=ShowWiki&pageid=8e3e4ba5-7f7e-461b-95af-80eb8bc4f44a)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-acumatica/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Velocity-BPA/n8n-nodes-acumatica/discussions)

## Acknowledgments

- [Acumatica](https://www.acumatica.com/) for providing a comprehensive ERP platform
- [n8n](https://n8n.io/) for the powerful workflow automation framework
- The n8n community for continuous inspiration and feedback
