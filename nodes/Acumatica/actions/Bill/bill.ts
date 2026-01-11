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

export const billOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['bill'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new vendor bill',
				action: 'Create a bill',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an unreleased bill',
				action: 'Delete a bill',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a bill by reference number',
				action: 'Get a bill',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many bills',
				action: 'Get many bills',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a bill',
				action: 'Update a bill',
			},
			{
				name: 'Add Line',
				value: 'addLine',
				description: 'Add a line item to a bill',
				action: 'Add bill line',
			},
			{
				name: 'Update Line',
				value: 'updateLine',
				description: 'Update a bill line item',
				action: 'Update bill line',
			},
			{
				name: 'Delete Line',
				value: 'deleteLine',
				description: 'Delete a bill line item',
				action: 'Delete bill line',
			},
			{
				name: 'Release',
				value: 'release',
				description: 'Release bill for posting',
				action: 'Release a bill',
			},
			{
				name: 'Get Applications',
				value: 'getApplications',
				description: 'Get payment applications',
				action: 'Get bill applications',
			},
			{
				name: 'Schedule Payment',
				value: 'schedulePayment',
				description: 'Schedule bill for payment batch',
				action: 'Schedule bill payment',
			},
		],
		default: 'getAll',
	},
];

export const billFields: INodeProperties[] = [
	// ----------------------------------
	//         bill: create
	// ----------------------------------
	{
		displayName: 'Bill Type',
		name: 'type',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Bill', value: 'Bill' },
			{ name: 'Credit Adjustment', value: 'CreditAdj' },
			{ name: 'Debit Adjustment', value: 'DebitAdj' },
			{ name: 'Prepayment', value: 'Prepayment' },
		],
		default: 'Bill',
		description: 'Type of vendor bill',
	},
	{
		displayName: 'Vendor ID',
		name: 'vendorId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Vendor account ID',
	},
	{
		displayName: 'Vendor Ref',
		name: 'vendorRef',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Vendor invoice/reference number',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				description: 'Bill amount',
			},
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				default: '',
				description: 'Branch for the bill',
			},
			{
				displayName: 'Currency ID',
				name: 'currencyId',
				type: 'string',
				default: '',
				description: 'Currency of the bill',
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'dateTime',
				default: '',
				description: 'Bill date',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Bill description',
			},
			{
				displayName: 'Details (Line Items)',
				name: 'details',
				type: 'json',
				default: '[]',
				description: 'Line items array: [{"InventoryID": "ITEM1", "Qty": 1, "UnitCost": 100}]',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				description: 'Payment due date',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: true,
				description: 'Whether to place bill on hold',
			},
			{
				displayName: 'Location ID',
				name: 'locationId',
				type: 'string',
				default: '',
				description: 'Vendor location ID',
			},
			{
				displayName: 'Post Period',
				name: 'postPeriod',
				type: 'string',
				default: '',
				description: 'Financial period for posting (e.g., 012024)',
			},
			{
				displayName: 'Terms',
				name: 'terms',
				type: 'string',
				default: '',
				description: 'Payment terms ID',
			},
		],
	},

	// ----------------------------------
	//         bill: get
	// ----------------------------------
	{
		displayName: 'Bill Type',
		name: 'type',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['get', 'delete', 'update', 'release', 'getApplications', 'schedulePayment', 'addLine', 'updateLine', 'deleteLine'],
			},
		},
		options: [
			{ name: 'Bill', value: 'Bill' },
			{ name: 'Credit Adjustment', value: 'CreditAdj' },
			{ name: 'Debit Adjustment', value: 'DebitAdj' },
			{ name: 'Prepayment', value: 'Prepayment' },
		],
		default: 'Bill',
		description: 'Type of vendor bill',
	},
	{
		displayName: 'Reference Number',
		name: 'referenceNbr',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['get', 'delete', 'update', 'release', 'getApplications', 'schedulePayment', 'addLine', 'updateLine', 'deleteLine'],
			},
		},
		default: '',
		description: 'Bill reference number',
	},

	// ----------------------------------
	//         bill: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				description: 'Bill amount',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Bill description',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				description: 'Payment due date',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: false,
				description: 'Whether to place bill on hold',
			},
			{
				displayName: 'Terms',
				name: 'terms',
				type: 'string',
				default: '',
				description: 'Payment terms ID',
			},
			{
				displayName: 'Vendor Ref',
				name: 'vendorRef',
				type: 'string',
				default: '',
				description: 'Vendor invoice number',
			},
		],
	},

	// ----------------------------------
	//         bill: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['bill'],
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
				resource: ['bill'],
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
				resource: ['bill'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Vendor ID',
				name: 'vendorId',
				type: 'string',
				default: '',
				description: 'Filter by vendor ID',
			},
			{
				displayName: 'Bill Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Bill', value: 'Bill' },
					{ name: 'Credit Adjustment', value: 'CreditAdj' },
					{ name: 'Debit Adjustment', value: 'DebitAdj' },
				],
				default: '',
				description: 'Filter by bill type',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Balanced', value: 'Balanced' },
					{ name: 'Closed', value: 'Closed' },
					{ name: 'Hold', value: 'Hold' },
					{ name: 'Open', value: 'Open' },
				],
				default: '',
				description: 'Filter by bill status',
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Filter bills from this date',
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Filter bills up to this date',
			},
		],
	},

	// ----------------------------------
	//         bill: addLine
	// ----------------------------------
	{
		displayName: 'Line Item',
		name: 'lineItem',
		type: 'collection',
		placeholder: 'Add Field',
		required: true,
		default: {},
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['addLine'],
			},
		},
		options: [
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				default: '',
				description: 'Expense account',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				description: 'Line amount',
			},
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				default: '',
				description: 'Branch for line item',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Line description',
			},
			{
				displayName: 'Inventory ID',
				name: 'inventoryId',
				type: 'string',
				default: '',
				description: 'Item/inventory ID',
			},
			{
				displayName: 'Project',
				name: 'project',
				type: 'string',
				default: '',
				description: 'Project ID',
			},
			{
				displayName: 'Quantity',
				name: 'qty',
				type: 'number',
				default: 1,
				description: 'Quantity',
			},
			{
				displayName: 'Subaccount',
				name: 'subaccount',
				type: 'string',
				default: '',
				description: 'Subaccount segments',
			},
			{
				displayName: 'Unit Cost',
				name: 'unitCost',
				type: 'number',
				default: 0,
				description: 'Unit cost',
			},
			{
				displayName: 'UOM',
				name: 'uom',
				type: 'string',
				default: '',
				description: 'Unit of measure',
			},
		],
	},

	// ----------------------------------
	//         bill: updateLine
	// ----------------------------------
	{
		displayName: 'Line Number',
		name: 'lineNbr',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['updateLine', 'deleteLine'],
			},
		},
		default: 0,
		description: 'Line number to update/delete',
	},
	{
		displayName: 'Line Updates',
		name: 'lineUpdates',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['updateLine'],
			},
		},
		options: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				description: 'Line amount',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Line description',
			},
			{
				displayName: 'Quantity',
				name: 'qty',
				type: 'number',
				default: 1,
				description: 'Quantity',
			},
			{
				displayName: 'Unit Cost',
				name: 'unitCost',
				type: 'number',
				default: 0,
				description: 'Unit cost',
			},
		],
	},

	// ----------------------------------
	//         bill: options
	// ----------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['bill'],
				operation: ['get', 'getAll', 'getApplications'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'multiOptions',
				options: [
					{ name: 'Applications', value: 'Applications' },
					{ name: 'Details', value: 'Details' },
					{ name: 'Tax Details', value: 'TaxDetails' },
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

export async function executeBillOperation(
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
			const vendorId = this.getNodeParameter('vendorId', index) as string;
			const vendorRef = this.getNodeParameter('vendorRef', index) as string;
			const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

			const bodyData: IDataObject = {
				Type: type,
				VendorID: vendorId,
				VendorRef: vendorRef,
			};

			if (additionalFields.details) {
				bodyData.Details = parseLineItems(additionalFields.details as string);
				delete additionalFields.details;
			}

			Object.assign(bodyData, additionalFields);
			const body = buildRequestBody(bodyData);

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Bill', body);
			break;
		}

		case 'get': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

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
				`/Bill/${type}/${encodeURIComponent(referenceNbr)}`,
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
			if (filters.vendorId) {
				filterParts.push(`VendorID eq '${filters.vendorId}'`);
			}
			if (filters.type) {
				filterParts.push(`Type eq '${filters.type}'`);
			}
			if (filters.status) {
				filterParts.push(`Status eq '${filters.status}'`);
			}
			if (filters.dateFrom) {
				filterParts.push(`Date ge datetimeoffset'${filters.dateFrom}'`);
			}
			if (filters.dateTo) {
				filterParts.push(`Date le datetimeoffset'${filters.dateTo}'`);
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
				responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Bill', {}, qs);
			} else {
				const limit = this.getNodeParameter('limit', index) as number;
				qs['$top'] = limit;
				responseData = await acumaticaApiRequest.call(this, 'GET', '/Bill', {}, qs);
			}
			break;
		}

		case 'update': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
			const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

			const body = buildRequestBody({
				Type: type,
				ReferenceNbr: referenceNbr,
				...updateFields,
			});

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Bill', body);
			break;
		}

		case 'delete': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			responseData = await acumaticaApiRequest.call(
				this,
				'DELETE',
				`/Bill/${type}/${encodeURIComponent(referenceNbr)}`,
			);
			responseData = { success: true };
			break;
		}

		case 'addLine': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
			const lineItem = this.getNodeParameter('lineItem', index, {}) as IDataObject;

			const lineData: Record<string, { value: unknown }> = {};
			for (const [key, value] of Object.entries(lineItem)) {
				if (value !== '' && value !== null && value !== undefined) {
					const apiKey = key.charAt(0).toUpperCase() + key.slice(1);
					lineData[apiKey] = { value };
				}
			}

			const body = {
				Type: { value: type },
				ReferenceNbr: { value: referenceNbr },
				Details: [lineData],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Bill', body);
			break;
		}

		case 'updateLine': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
			const lineNbr = this.getNodeParameter('lineNbr', index) as number;
			const lineUpdates = this.getNodeParameter('lineUpdates', index, {}) as IDataObject;

			const lineData: Record<string, { value: unknown }> = {
				LineNbr: { value: lineNbr },
			};
			for (const [key, value] of Object.entries(lineUpdates)) {
				if (value !== '' && value !== null && value !== undefined) {
					const apiKey = key.charAt(0).toUpperCase() + key.slice(1);
					lineData[apiKey] = { value };
				}
			}

			const body = {
				Type: { value: type },
				ReferenceNbr: { value: referenceNbr },
				Details: [lineData],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Bill', body);
			break;
		}

		case 'deleteLine': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
			const lineNbr = this.getNodeParameter('lineNbr', index) as number;

			const body = {
				Type: { value: type },
				ReferenceNbr: { value: referenceNbr },
				Details: [
					{
						LineNbr: { value: lineNbr },
						delete: true,
					},
				],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Bill', body);
			break;
		}

		case 'release': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Bill',
				'ReleaseBill',
				{ Type: { value: type }, ReferenceNbr: { value: referenceNbr } },
			);
			break;
		}

		case 'getApplications': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			const qs: IDataObject = {
				'$expand': 'Applications',
			};

			responseData = await acumaticaApiRequest.call(
				this,
				'GET',
				`/Bill/${type}/${encodeURIComponent(referenceNbr)}`,
				{},
				qs,
			);
			break;
		}

		case 'schedulePayment': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Bill',
				'AddToBatch',
				{ Type: { value: type }, ReferenceNbr: { value: referenceNbr } },
			);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Bill`);
	}

	return prepareOutput.call(this, responseData, simplify);
}
