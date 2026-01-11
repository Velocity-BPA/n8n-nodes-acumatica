/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { acumaticaApiRequest, acumaticaApiRequestAllItems, acumaticaApiAction, buildRequestBody } from '../../transport';
import { prepareOutput, parseLineItems } from '../../utils/helpers';

export const shipmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['shipment'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new shipment',
				action: 'Create a shipment',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a shipment',
				action: 'Delete a shipment',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a shipment by number',
				action: 'Get a shipment',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many shipments',
				action: 'Get many shipments',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a shipment',
				action: 'Update a shipment',
			},
			{
				name: 'Confirm',
				value: 'confirm',
				description: 'Confirm shipment for invoicing',
				action: 'Confirm a shipment',
			},
			{
				name: 'Correct',
				value: 'correct',
				description: 'Correct a confirmed shipment',
				action: 'Correct a shipment',
			},
			{
				name: 'Get Packages',
				value: 'getPackages',
				description: 'Get package details for shipment',
				action: 'Get shipment packages',
			},
			{
				name: 'Add Package',
				value: 'addPackage',
				description: 'Add a shipping package',
				action: 'Add shipment package',
			},
			{
				name: 'Create Invoice',
				value: 'createInvoice',
				description: 'Create invoice from shipment',
				action: 'Create invoice from shipment',
			},
			{
				name: 'Print Labels',
				value: 'printLabels',
				description: 'Generate shipping labels',
				action: 'Print shipping labels',
			},
			{
				name: 'Get Tracking',
				value: 'getTracking',
				description: 'Get carrier tracking information',
				action: 'Get tracking info',
			},
		],
		default: 'getAll',
	},
];

export const shipmentFields: INodeProperties[] = [
	// ----------------------------------
	//         shipment: create
	// ----------------------------------
	{
		displayName: 'Shipment Type',
		name: 'type',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Shipment', value: 'Shipment' },
			{ name: 'Transfer', value: 'Transfer' },
			{ name: 'Receipt', value: 'Receipt' },
		],
		default: 'Shipment',
		description: 'Type of shipment',
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Customer account ID (for Shipment type)',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Details (Line Items)',
				name: 'details',
				type: 'json',
				default: '[]',
				description: 'Shipment lines: [{"InventoryID": "ITEM1", "OrderType": "SO", "OrderNbr": "000001", "ShippedQty": 10}]',
			},
			{
				displayName: 'FOB Point',
				name: 'fobPoint',
				type: 'string',
				default: '',
				description: 'FOB point',
			},
			{
				displayName: 'Freight Amount',
				name: 'freightAmount',
				type: 'number',
				default: 0,
				description: 'Freight amount',
			},
			{
				displayName: 'Freight Cost',
				name: 'freightCost',
				type: 'number',
				default: 0,
				description: 'Freight cost',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: false,
				description: 'Whether to place shipment on hold',
			},
			{
				displayName: 'Location ID',
				name: 'locationId',
				type: 'string',
				default: '',
				description: 'Customer location ID',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'Issue', value: 'Issue' },
					{ name: 'Receipt', value: 'Receipt' },
				],
				default: 'Issue',
				description: 'Shipment operation type',
			},
			{
				displayName: 'Packages',
				name: 'packages',
				type: 'json',
				default: '[]',
				description: 'Package details: [{"BoxID": "MEDIUM", "Weight": 5.5}]',
			},
			{
				displayName: 'Ship Date',
				name: 'shipDate',
				type: 'dateTime',
				default: '',
				description: 'Shipment date',
			},
			{
				displayName: 'Ship Via',
				name: 'shipVia',
				type: 'string',
				default: '',
				description: 'Shipping carrier/method',
			},
			{
				displayName: 'Shipping Terms',
				name: 'shippingTerms',
				type: 'string',
				default: '',
				description: 'Shipping terms ID',
			},
			{
				displayName: 'Warehouse ID',
				name: 'warehouseId',
				type: 'string',
				default: '',
				description: 'Warehouse/site ID',
			},
		],
	},

	// ----------------------------------
	//         shipment: get
	// ----------------------------------
	{
		displayName: 'Shipment Number',
		name: 'shipmentNbr',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['get', 'delete', 'update', 'confirm', 'correct', 'getPackages', 'addPackage', 'createInvoice', 'printLabels', 'getTracking'],
			},
		},
		default: '',
		description: 'Shipment number',
	},

	// ----------------------------------
	//         shipment: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'FOB Point',
				name: 'fobPoint',
				type: 'string',
				default: '',
				description: 'FOB point',
			},
			{
				displayName: 'Freight Amount',
				name: 'freightAmount',
				type: 'number',
				default: 0,
				description: 'Freight amount',
			},
			{
				displayName: 'Freight Cost',
				name: 'freightCost',
				type: 'number',
				default: 0,
				description: 'Freight cost',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: false,
				description: 'Whether to place shipment on hold',
			},
			{
				displayName: 'Ship Date',
				name: 'shipDate',
				type: 'dateTime',
				default: '',
				description: 'Shipment date',
			},
			{
				displayName: 'Ship Via',
				name: 'shipVia',
				type: 'string',
				default: '',
				description: 'Shipping carrier/method',
			},
		],
	},

	// ----------------------------------
	//         shipment: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['shipment'],
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
				resource: ['shipment'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 100,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				default: '',
				description: 'Filter by customer ID',
			},
			{
				displayName: 'Shipment Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Shipment', value: 'Shipment' },
					{ name: 'Transfer', value: 'Transfer' },
					{ name: 'Receipt', value: 'Receipt' },
				],
				default: '',
				description: 'Filter by shipment type',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Completed', value: 'Completed' },
					{ name: 'Confirmed', value: 'Confirmed' },
					{ name: 'Hold', value: 'Hold' },
					{ name: 'Open', value: 'Open' },
				],
				default: '',
				description: 'Filter by shipment status',
			},
			{
				displayName: 'Warehouse ID',
				name: 'warehouseId',
				type: 'string',
				default: '',
				description: 'Filter by warehouse',
			},
			{
				displayName: 'Ship Via',
				name: 'shipVia',
				type: 'string',
				default: '',
				description: 'Filter by shipping carrier',
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Filter shipments from this date',
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Filter shipments up to this date',
			},
		],
	},

	// ----------------------------------
	//         shipment: addPackage
	// ----------------------------------
	{
		displayName: 'Package Details',
		name: 'packageDetails',
		type: 'collection',
		placeholder: 'Add Field',
		required: true,
		default: {},
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['addPackage'],
			},
		},
		options: [
			{
				displayName: 'Box ID',
				name: 'boxId',
				type: 'string',
				default: '',
				description: 'Box/package type ID',
			},
			{
				displayName: 'Custom',
				name: 'custom',
				type: 'boolean',
				default: false,
				description: 'Whether this is a custom box',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Package description',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Package height',
			},
			{
				displayName: 'Length',
				name: 'length',
				type: 'number',
				default: 0,
				description: 'Package length',
			},
			{
				displayName: 'Tracking Number',
				name: 'trackingNbr',
				type: 'string',
				default: '',
				description: 'Carrier tracking number',
			},
			{
				displayName: 'Weight',
				name: 'weight',
				type: 'number',
				default: 0,
				description: 'Package weight',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Package width',
			},
		],
	},

	// ----------------------------------
	//         shipment: options
	// ----------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['get', 'getAll', 'getPackages', 'getTracking'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'multiOptions',
				options: [
					{ name: 'Details', value: 'Details' },
					{ name: 'Orders', value: 'Orders' },
					{ name: 'Packages', value: 'Packages' },
				],
				default: [],
				description: 'Related entities to include',
			},
			{
				displayName: 'Select Fields',
				name: 'select',
				type: 'string',
				default: '',
				description: 'Comma-separated list of fields to return',
			},
			{
				displayName: 'Simplify Response',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response',
			},
		],
	},
];

export async function executeShipmentOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const options = this.getNodeParameter('options', index, {}) as {
		expand?: string[];
		select?: string;
		simplify?: boolean;
	};
	const simplify = options.simplify !== false;

	let responseData;

	switch (operation) {
		case 'create': {
			const type = this.getNodeParameter('type', index) as string;
			const customerId = this.getNodeParameter('customerId', index, '') as string;
			const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

			const bodyData: IDataObject = {
				Type: type,
			};

			if (customerId) {
				bodyData.CustomerID = customerId;
			}

			if (additionalFields.details) {
				bodyData.Details = parseLineItems(additionalFields.details as string);
				delete additionalFields.details;
			}

			if (additionalFields.packages) {
				bodyData.Packages = parseLineItems(additionalFields.packages as string);
				delete additionalFields.packages;
			}

			Object.assign(bodyData, additionalFields);
			const body = buildRequestBody(bodyData);

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Shipment', body);
			break;
		}

		case 'get': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			const qs: IDataObject = {};
			if (options.expand?.length) {
				qs['$expand'] = options.expand.join(',');
			}
			if (options.select) {
				qs['$select'] = options.select;
			}

			responseData = await acumaticaApiRequest.call(
				this,
				'GET',
				`/Shipment/${encodeURIComponent(shipmentNbr)}`,
				{},
				qs,
			);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', index) as boolean;
			const filters = this.getNodeParameter('filters', index, {}) as IDataObject;

			const qs: IDataObject = {};

			const filterParts: string[] = [];
			if (filters.customerId) {
				filterParts.push(`CustomerID eq '${filters.customerId}'`);
			}
			if (filters.type) {
				filterParts.push(`Type eq '${filters.type}'`);
			}
			if (filters.status) {
				filterParts.push(`Status eq '${filters.status}'`);
			}
			if (filters.warehouseId) {
				filterParts.push(`WarehouseID eq '${filters.warehouseId}'`);
			}
			if (filters.shipVia) {
				filterParts.push(`ShipVia eq '${filters.shipVia}'`);
			}
			if (filters.dateFrom) {
				filterParts.push(`ShipDate ge datetimeoffset'${filters.dateFrom}'`);
			}
			if (filters.dateTo) {
				filterParts.push(`ShipDate le datetimeoffset'${filters.dateTo}'`);
			}

			if (filterParts.length > 0) {
				qs['$filter'] = filterParts.join(' and ');
			}

			if (options.expand?.length) {
				qs['$expand'] = options.expand.join(',');
			}
			if (options.select) {
				qs['$select'] = options.select;
			}

			if (returnAll) {
				responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Shipment', {}, qs);
			} else {
				const limit = this.getNodeParameter('limit', index) as number;
				qs['$top'] = limit;
				responseData = await acumaticaApiRequest.call(this, 'GET', '/Shipment', {}, qs);
			}
			break;
		}

		case 'update': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;
			const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

			const body = buildRequestBody({
				ShipmentNbr: shipmentNbr,
				...updateFields,
			});

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Shipment', body);
			break;
		}

		case 'delete': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			responseData = await acumaticaApiRequest.call(
				this,
				'DELETE',
				`/Shipment/${encodeURIComponent(shipmentNbr)}`,
			);
			responseData = { success: true };
			break;
		}

		case 'confirm': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Shipment',
				'ConfirmShipment',
				{ ShipmentNbr: { value: shipmentNbr } },
			);
			break;
		}

		case 'correct': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Shipment',
				'CorrectShipment',
				{ ShipmentNbr: { value: shipmentNbr } },
			);
			break;
		}

		case 'getPackages': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			const qs: IDataObject = {
				'$expand': 'Packages',
			};

			responseData = await acumaticaApiRequest.call(
				this,
				'GET',
				`/Shipment/${encodeURIComponent(shipmentNbr)}`,
				{},
				qs,
			);
			break;
		}

		case 'addPackage': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;
			const packageDetails = this.getNodeParameter('packageDetails', index, {}) as IDataObject;

			const packageData: Record<string, { value: unknown }> = {};
			for (const [key, value] of Object.entries(packageDetails)) {
				if (value !== '' && value !== null && value !== undefined) {
					const apiKey = key.charAt(0).toUpperCase() + key.slice(1);
					packageData[apiKey] = { value };
				}
			}

			const body = {
				ShipmentNbr: { value: shipmentNbr },
				Packages: [packageData],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Shipment', body);
			break;
		}

		case 'createInvoice': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Shipment',
				'CreateInvoice',
				{ ShipmentNbr: { value: shipmentNbr } },
			);
			break;
		}

		case 'printLabels': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Shipment',
				'GetLabels',
				{ ShipmentNbr: { value: shipmentNbr } },
			);
			break;
		}

		case 'getTracking': {
			const shipmentNbr = this.getNodeParameter('shipmentNbr', index) as string;

			const qs: IDataObject = {
				'$expand': 'Packages',
				'$select': 'ShipmentNbr,Status,ShipVia,Packages/TrackingNbr',
			};

			responseData = await acumaticaApiRequest.call(
				this,
				'GET',
				`/Shipment/${encodeURIComponent(shipmentNbr)}`,
				{},
				qs,
			);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Shipment`);
	}

	return prepareOutput.call(this, responseData, simplify);
}
