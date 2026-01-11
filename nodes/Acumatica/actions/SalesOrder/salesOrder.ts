/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems, acumaticaApiAction, buildODataFilter, buildRequestBody } from '../../transport';
import { prepareOutput, STATUS_OPTIONS, ORDER_TYPE_OPTIONS, parseLineItems } from '../../utils';

export const salesOrderOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['salesOrder'],
      },
    },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new sales order', action: 'Create a sales order' },
      { name: 'Delete', value: 'delete', description: 'Delete a sales order', action: 'Delete a sales order' },
      { name: 'Get', value: 'get', description: 'Get a sales order', action: 'Get a sales order' },
      { name: 'Get Many', value: 'getAll', description: 'Get many sales orders', action: 'Get many sales orders' },
      { name: 'Update', value: 'update', description: 'Update a sales order', action: 'Update a sales order' },
      { name: 'Add Line', value: 'addLine', description: 'Add a line item', action: 'Add line to sales order' },
      { name: 'Update Line', value: 'updateLine', description: 'Update a line item', action: 'Update sales order line' },
      { name: 'Delete Line', value: 'deleteLine', description: 'Delete a line item', action: 'Delete sales order line' },
      { name: 'Get Shipments', value: 'getShipments', description: 'Get related shipments', action: 'Get sales order shipments' },
      { name: 'Create Shipment', value: 'createShipment', description: 'Create shipment from order', action: 'Create shipment from order' },
      { name: 'Hold Order', value: 'holdOrder', description: 'Place order on hold', action: 'Hold sales order' },
      { name: 'Remove Hold', value: 'removeHold', description: 'Remove hold from order', action: 'Remove hold from order' },
      { name: 'Cancel Order', value: 'cancelOrder', description: 'Cancel the sales order', action: 'Cancel sales order' },
    ],
    default: 'getAll',
  },
];

export const salesOrderFields: INodeProperties[] = [
  // Order Type for all operations
  {
    displayName: 'Order Type',
    name: 'orderType',
    type: 'options',
    options: ORDER_TYPE_OPTIONS.salesOrder,
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['create', 'get', 'update', 'delete', 'addLine', 'updateLine', 'deleteLine', 'getShipments', 'createShipment', 'holdOrder', 'removeHold', 'cancelOrder'],
      },
    },
    default: 'SO',
    description: 'The type of sales order',
  },
  // Order Number for get, update, delete, etc.
  {
    displayName: 'Order Number',
    name: 'orderNbr',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['get', 'update', 'delete', 'addLine', 'updateLine', 'deleteLine', 'getShipments', 'createShipment', 'holdOrder', 'removeHold', 'cancelOrder'],
      },
    },
    default: '',
    description: 'The order number',
  },
  // Customer ID for create
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The customer account ID',
  },
  // Line items for create
  {
    displayName: 'Line Items',
    name: 'lineItems',
    type: 'json',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['create'],
      },
    },
    default: '[]',
    description: 'JSON array of line items. Each item should have InventoryID, Quantity, and optionally UnitPrice, WarehouseID, UOM',
  },
  // Additional fields for create
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['create'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
      },
      {
        displayName: 'External Reference',
        name: 'externalRef',
        type: 'string',
        default: '',
        description: 'External order reference (e.g., e-commerce order ID)',
      },
      {
        displayName: 'Hold',
        name: 'hold',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Location ID',
        name: 'locationId',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Order Date',
        name: 'orderDate',
        type: 'dateTime',
        default: '',
      },
      {
        displayName: 'Requested On',
        name: 'requestedOn',
        type: 'dateTime',
        default: '',
        description: 'Requested delivery date',
      },
      {
        displayName: 'Ship Via',
        name: 'shipVia',
        type: 'string',
        default: '',
        description: 'Shipping carrier/method',
      },
      {
        displayName: 'Terms',
        name: 'terms',
        type: 'string',
        default: '',
      },
    ],
  },
  // Update fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['update'],
      },
    },
    default: {},
    options: [
      {
        displayName: 'Customer ID',
        name: 'customerId',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
      },
      {
        displayName: 'External Reference',
        name: 'externalRef',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Hold',
        name: 'hold',
        type: 'boolean',
        default: false,
      },
      {
        displayName: 'Location ID',
        name: 'locationId',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Requested On',
        name: 'requestedOn',
        type: 'dateTime',
        default: '',
      },
      {
        displayName: 'Ship Via',
        name: 'shipVia',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Terms',
        name: 'terms',
        type: 'string',
        default: '',
      },
    ],
  },
  // Add Line fields
  {
    displayName: 'Inventory ID',
    name: 'inventoryId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['addLine', 'updateLine'],
      },
    },
    default: '',
    description: 'The item/SKU to add',
  },
  {
    displayName: 'Quantity',
    name: 'quantity',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['addLine', 'updateLine'],
      },
    },
    typeOptions: {
      minValue: 0,
    },
    default: 1,
  },
  {
    displayName: 'Line Number',
    name: 'lineNbr',
    type: 'number',
    required: true,
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['updateLine', 'deleteLine'],
      },
    },
    default: 1,
    description: 'The line number to update/delete',
  },
  {
    displayName: 'Line Additional Fields',
    name: 'lineAdditionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['addLine', 'updateLine'],
      },
    },
    default: {},
    options: [
      { displayName: 'Discount Amount', name: 'discountAmount', type: 'number', default: 0 },
      { displayName: 'Discount Percent', name: 'discountPercent', type: 'number', default: 0 },
      { displayName: 'Unit Price', name: 'unitPrice', type: 'number', default: 0 },
      { displayName: 'UOM', name: 'uom', type: 'string', default: '' },
      { displayName: 'Warehouse ID', name: 'warehouseId', type: 'string', default: '' },
    ],
  },
  // Get All options
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['getAll'],
      },
    },
    default: false,
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
      maxValue: 500,
    },
    default: 50,
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['getAll'],
      },
    },
    default: {},
    options: [
      { displayName: 'Customer ID', name: 'CustomerID', type: 'string', default: '' },
      { displayName: 'Order Type', name: 'OrderType', type: 'options', options: ORDER_TYPE_OPTIONS.salesOrder, default: '' },
      { displayName: 'Status', name: 'Status', type: 'options', options: STATUS_OPTIONS.salesOrder, default: '' },
    ],
  },
  // Warehouse ID for createShipment
  {
    displayName: 'Warehouse ID',
    name: 'warehouseId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
        operation: ['createShipment'],
      },
    },
    default: '',
    description: 'The warehouse to ship from (optional)',
  },
  // Simplify option
  {
    displayName: 'Simplify',
    name: 'simplify',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['salesOrder'],
      },
    },
    default: true,
    description: 'Whether to return a simplified version of the response instead of the raw data',
  },
];

export async function executeSalesOrderOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const simplify = this.getNodeParameter('simplify', index, true) as boolean;

  let responseData: IDataObject | IDataObject[];

  if (operation === 'create') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const customerId = this.getNodeParameter('customerId', index) as string;
    const lineItemsRaw = this.getNodeParameter('lineItems', index) as string;
    const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

    const lineItems = parseLineItems(lineItemsRaw);

    const body: IDataObject = {
      OrderType: orderType,
      CustomerID: customerId,
      Details: lineItems.map((item) => ({
        InventoryID: item.InventoryID || item.inventoryId,
        OrderQty: item.Quantity || item.quantity || item.OrderQty,
        UnitPrice: item.UnitPrice || item.unitPrice,
        WarehouseID: item.WarehouseID || item.warehouseId,
        UOM: item.UOM || item.uom,
      })),
    };

    if (additionalFields.description) body.Description = additionalFields.description;
    if (additionalFields.externalRef) body.ExternalRef = additionalFields.externalRef;
    if (additionalFields.hold !== undefined) body.Hold = additionalFields.hold;
    if (additionalFields.locationId) body.LocationID = additionalFields.locationId;
    if (additionalFields.orderDate) body.Date = additionalFields.orderDate;
    if (additionalFields.requestedOn) body.RequestedOn = additionalFields.requestedOn;
    if (additionalFields.shipVia) body.ShipVia = additionalFields.shipVia;
    if (additionalFields.terms) body.Terms = additionalFields.terms;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/SalesOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'get') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/SalesOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
      undefined,
      { $expand: 'Details,ShippingSettings,BillToAddress,ShipToAddress,Payments' },
    ) as IDataObject;
  } else if (operation === 'getAll') {
    const returnAll = this.getNodeParameter('returnAll', index) as boolean;
    const filters = this.getNodeParameter('filters', index) as IDataObject;

    const query: IDataObject = {};
    if (Object.keys(filters).length > 0) {
      query['$filter'] = buildODataFilter(filters);
    }

    if (returnAll) {
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/SalesOrder', undefined, query);
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/SalesOrder', undefined, query, limit);
    }
  } else if (operation === 'update') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;
    const updateFields = this.getNodeParameter('updateFields', index) as IDataObject;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
    };

    if (updateFields.customerId) body.CustomerID = updateFields.customerId;
    if (updateFields.description) body.Description = updateFields.description;
    if (updateFields.externalRef) body.ExternalRef = updateFields.externalRef;
    if (updateFields.hold !== undefined) body.Hold = updateFields.hold;
    if (updateFields.locationId) body.LocationID = updateFields.locationId;
    if (updateFields.requestedOn) body.RequestedOn = updateFields.requestedOn;
    if (updateFields.shipVia) body.ShipVia = updateFields.shipVia;
    if (updateFields.terms) body.Terms = updateFields.terms;

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/SalesOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'delete') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    await acumaticaApiRequest.call(
      this,
      'DELETE',
      `/SalesOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
    );
    responseData = { success: true, orderType, orderNbr };
  } else if (operation === 'addLine') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;
    const quantity = this.getNodeParameter('quantity', index) as number;
    const lineFields = this.getNodeParameter('lineAdditionalFields', index) as IDataObject;

    const lineItem: IDataObject = {
      InventoryID: inventoryId,
      OrderQty: quantity,
    };

    if (lineFields.unitPrice) lineItem.UnitPrice = lineFields.unitPrice;
    if (lineFields.uom) lineItem.UOM = lineFields.uom;
    if (lineFields.warehouseId) lineItem.WarehouseID = lineFields.warehouseId;
    if (lineFields.discountAmount) lineItem.DiscountAmount = lineFields.discountAmount;
    if (lineFields.discountPercent) lineItem.DiscountPercent = lineFields.discountPercent;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
      Details: [lineItem],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/SalesOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'updateLine') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;
    const lineNbr = this.getNodeParameter('lineNbr', index) as number;
    const inventoryId = this.getNodeParameter('inventoryId', index) as string;
    const quantity = this.getNodeParameter('quantity', index) as number;
    const lineFields = this.getNodeParameter('lineAdditionalFields', index) as IDataObject;

    const lineItem: IDataObject = {
      LineNbr: lineNbr,
      InventoryID: inventoryId,
      OrderQty: quantity,
    };

    if (lineFields.unitPrice) lineItem.UnitPrice = lineFields.unitPrice;
    if (lineFields.uom) lineItem.UOM = lineFields.uom;
    if (lineFields.warehouseId) lineItem.WarehouseID = lineFields.warehouseId;
    if (lineFields.discountAmount) lineItem.DiscountAmount = lineFields.discountAmount;
    if (lineFields.discountPercent) lineItem.DiscountPercent = lineFields.discountPercent;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
      Details: [lineItem],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/SalesOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'deleteLine') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;
    const lineNbr = this.getNodeParameter('lineNbr', index) as number;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
      Details: [
        {
          LineNbr: lineNbr,
          delete: true,
        },
      ],
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/SalesOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'getShipments') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    responseData = await acumaticaApiRequest.call(
      this,
      'GET',
      `/SalesOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
      undefined,
      { $expand: 'Shipments' },
    ) as IDataObject;
    responseData = (responseData.Shipments as IDataObject[]) || [];
  } else if (operation === 'createShipment') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;
    const warehouseId = this.getNodeParameter('warehouseId', index, '') as string;

    // First get the order to get its ID
    const order = await acumaticaApiRequest.call(
      this,
      'GET',
      `/SalesOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
    ) as IDataObject;

    const actionParams: IDataObject = {};
    if (warehouseId) {
      actionParams.WarehouseID = warehouseId;
    }

    responseData = await acumaticaApiAction.call(
      this,
      '/SalesOrder',
      order.id as string,
      'CreateShipment',
      actionParams,
    );
  } else if (operation === 'holdOrder') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
      Hold: true,
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/SalesOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'removeHold') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    const body: IDataObject = {
      OrderType: orderType,
      OrderNbr: orderNbr,
      Hold: false,
    };

    responseData = await acumaticaApiRequest.call(this, 'PUT', '/SalesOrder', buildRequestBody(body)) as IDataObject;
  } else if (operation === 'cancelOrder') {
    const orderType = this.getNodeParameter('orderType', index) as string;
    const orderNbr = this.getNodeParameter('orderNbr', index) as string;

    const order = await acumaticaApiRequest.call(
      this,
      'GET',
      `/SalesOrder/${encodeURIComponent(orderType)}/${encodeURIComponent(orderNbr)}`,
    ) as IDataObject;

    responseData = await acumaticaApiAction.call(
      this,
      '/SalesOrder',
      order.id as string,
      'CancelSalesOrder',
    );
  } else {
    throw new Error(`Operation ${operation} is not supported`);
  }

  return prepareOutput(responseData, simplify);
}
