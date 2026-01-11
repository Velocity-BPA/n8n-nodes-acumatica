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
import { acumaticaApiRequest, acumaticaApiRequestAllItems, acumaticaApiAction, buildODataFilter, buildRequestBody } from '../../transport';
import { prepareOutput } from '../../utils/helpers';

export const paymentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['payment'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new AR payment',
				action: 'Create a payment',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an unreleased payment',
				action: 'Delete a payment',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a payment by reference number',
				action: 'Get a payment',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many payments',
				action: 'Get many payments',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a payment',
				action: 'Update a payment',
			},
			{
				name: 'Release',
				value: 'release',
				description: 'Release payment for posting',
				action: 'Release a payment',
			},
			{
				name: 'Void',
				value: 'void',
				description: 'Void a released payment',
				action: 'Void a payment',
			},
			{
				name: 'Get Applications',
				value: 'getApplications',
				description: 'Get document applications for payment',
				action: 'Get payment applications',
			},
			{
				name: 'Apply to Document',
				value: 'applyToDocument',
				description: 'Apply payment to an invoice or order',
				action: 'Apply payment to document',
			},
			{
				name: 'Remove Application',
				value: 'removeApplication',
				description: 'Remove a payment application',
				action: 'Remove payment application',
			},
		],
		default: 'getAll',
	},
];

export const paymentFields: INodeProperties[] = [
	// ----------------------------------
	//         payment: create
	// ----------------------------------
	{
		displayName: 'Payment Type',
		name: 'type',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Payment', value: 'Payment' },
			{ name: 'Prepayment', value: 'Prepayment' },
			{ name: 'Refund', value: 'Refund' },
			{ name: 'Credit Memo', value: 'CreditMemo' },
		],
		default: 'Payment',
		description: 'Type of payment',
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Customer account ID',
	},
	{
		displayName: 'Payment Amount',
		name: 'paymentAmount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['create'],
			},
		},
		default: 0,
		description: 'Amount of the payment',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Application Date',
				name: 'applicationDate',
				type: 'dateTime',
				default: '',
				description: 'Date when payment is applied',
			},
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				default: '',
				description: 'Branch for the payment',
			},
			{
				displayName: 'Cash Account',
				name: 'cashAccount',
				type: 'string',
				default: '',
				description: 'Cash account for the payment',
			},
			{
				displayName: 'Currency ID',
				name: 'currencyId',
				type: 'string',
				default: '',
				description: 'Currency of the payment',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Payment description',
			},
			{
				displayName: 'External Ref',
				name: 'extRef',
				type: 'string',
				default: '',
				description: 'External reference (check number, etc.)',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: true,
				description: 'Whether to place payment on hold',
			},
			{
				displayName: 'Payment Date',
				name: 'paymentDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the payment',
			},
			{
				displayName: 'Payment Method',
				name: 'paymentMethod',
				type: 'options',
				options: [
					{ name: 'Cash', value: 'CASH' },
					{ name: 'Check', value: 'CHECK' },
					{ name: 'Credit Card', value: 'CCPMT' },
					{ name: 'EFT', value: 'EFT' },
					{ name: 'Wire', value: 'WIRE' },
				],
				default: 'CHECK',
				description: 'Method of payment',
			},
			{
				displayName: 'Payment Ref',
				name: 'paymentRef',
				type: 'string',
				default: '',
				description: 'Payment reference number',
			},
		],
	},

	// ----------------------------------
	//         payment: get
	// ----------------------------------
	{
		displayName: 'Payment Type',
		name: 'type',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['get', 'delete', 'update', 'release', 'void', 'getApplications', 'applyToDocument', 'removeApplication'],
			},
		},
		options: [
			{ name: 'Payment', value: 'Payment' },
			{ name: 'Prepayment', value: 'Prepayment' },
			{ name: 'Refund', value: 'Refund' },
			{ name: 'Credit Memo', value: 'CreditMemo' },
			{ name: 'Void Payment', value: 'VoidPayment' },
		],
		default: 'Payment',
		description: 'Type of payment',
	},
	{
		displayName: 'Reference Number',
		name: 'referenceNbr',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['get', 'delete', 'update', 'release', 'void', 'getApplications', 'applyToDocument', 'removeApplication'],
			},
		},
		default: '',
		description: 'Payment reference number',
	},

	// ----------------------------------
	//         payment: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Application Date',
				name: 'applicationDate',
				type: 'dateTime',
				default: '',
				description: 'Date when payment is applied',
			},
			{
				displayName: 'Cash Account',
				name: 'cashAccount',
				type: 'string',
				default: '',
				description: 'Cash account for the payment',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Payment description',
			},
			{
				displayName: 'External Ref',
				name: 'extRef',
				type: 'string',
				default: '',
				description: 'External reference',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: false,
				description: 'Whether to place payment on hold',
			},
			{
				displayName: 'Payment Amount',
				name: 'paymentAmount',
				type: 'number',
				default: 0,
				description: 'Amount of the payment',
			},
			{
				displayName: 'Payment Date',
				name: 'paymentDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the payment',
			},
			{
				displayName: 'Payment Method',
				name: 'paymentMethod',
				type: 'string',
				default: '',
				description: 'Method of payment',
			},
		],
	},

	// ----------------------------------
	//         payment: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['payment'],
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
				resource: ['payment'],
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
				resource: ['payment'],
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
				displayName: 'Payment Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Payment', value: 'Payment' },
					{ name: 'Prepayment', value: 'Prepayment' },
					{ name: 'Refund', value: 'Refund' },
				],
				default: '',
				description: 'Filter by payment type',
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
					{ name: 'Released', value: 'Released' },
				],
				default: '',
				description: 'Filter by payment status',
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Filter payments from this date',
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Filter payments up to this date',
			},
		],
	},

	// ----------------------------------
	//         payment: applyToDocument
	// ----------------------------------
	{
		displayName: 'Document Type',
		name: 'docType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['applyToDocument'],
			},
		},
		options: [
			{ name: 'Invoice', value: 'INV' },
			{ name: 'Debit Memo', value: 'DM' },
			{ name: 'Finance Charge', value: 'FC' },
		],
		default: 'INV',
		description: 'Type of document to apply payment to',
	},
	{
		displayName: 'Document Reference Number',
		name: 'docRefNbr',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['applyToDocument'],
			},
		},
		default: '',
		description: 'Reference number of the document to apply payment to',
	},
	{
		displayName: 'Amount to Apply',
		name: 'amountPaid',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['applyToDocument'],
			},
		},
		default: 0,
		description: 'Amount to apply from this payment',
	},

	// ----------------------------------
	//         payment: removeApplication
	// ----------------------------------
	{
		displayName: 'Application Line Number',
		name: 'lineNbr',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['removeApplication'],
			},
		},
		default: 0,
		description: 'Line number of the application to remove',
	},

	// ----------------------------------
	//         payment: options
	// ----------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['payment'],
				operation: ['get', 'getAll', 'getApplications'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'multiOptions',
				options: [
					{ name: 'Applications History', value: 'ApplicationsHistory' },
					{ name: 'Documents to Apply', value: 'DocumentsToApply' },
					{ name: 'Orders to Apply', value: 'OrdersToApply' },
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

export async function executePaymentOperation(
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
			const customerId = this.getNodeParameter('customerId', index) as string;
			const paymentAmount = this.getNodeParameter('paymentAmount', index) as number;
			const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

			const body = buildRequestBody({
				Type: type,
				CustomerID: customerId,
				PaymentAmount: paymentAmount,
				...additionalFields,
			});

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Payment', body);
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
				`/Payment/${type}/${encodeURIComponent(referenceNbr)}`,
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
			if (filters.dateFrom) {
				filterParts.push(`PaymentDate ge datetimeoffset'${filters.dateFrom}'`);
			}
			if (filters.dateTo) {
				filterParts.push(`PaymentDate le datetimeoffset'${filters.dateTo}'`);
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
				responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/Payment', {}, qs);
			} else {
				const limit = this.getNodeParameter('limit', index) as number;
				qs['$top'] = limit;
				responseData = await acumaticaApiRequest.call(this, 'GET', '/Payment', {}, qs);
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

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Payment', body);
			break;
		}

		case 'delete': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			responseData = await acumaticaApiRequest.call(
				this,
				'DELETE',
				`/Payment/${type}/${encodeURIComponent(referenceNbr)}`,
			);
			responseData = { success: true };
			break;
		}

		case 'release': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Payment',
				'ReleasePayment',
				{ Type: { value: type }, ReferenceNbr: { value: referenceNbr } },
			);
			break;
		}

		case 'void': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/Payment',
				'VoidPayment',
				{ Type: { value: type }, ReferenceNbr: { value: referenceNbr } },
			);
			break;
		}

		case 'getApplications': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;

			const qs: IDataObject = {
				'$expand': 'DocumentsToApply,ApplicationsHistory',
			};

			responseData = await acumaticaApiRequest.call(
				this,
				'GET',
				`/Payment/${type}/${encodeURIComponent(referenceNbr)}`,
				{},
				qs,
			);
			break;
		}

		case 'applyToDocument': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
			const docType = this.getNodeParameter('docType', index) as string;
			const docRefNbr = this.getNodeParameter('docRefNbr', index) as string;
			const amountPaid = this.getNodeParameter('amountPaid', index) as number;

			const body = {
				Type: { value: type },
				ReferenceNbr: { value: referenceNbr },
				DocumentsToApply: [
					{
						DocType: { value: docType },
						ReferenceNbr: { value: docRefNbr },
						AmountPaid: { value: amountPaid },
					},
				],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Payment', body);
			break;
		}

		case 'removeApplication': {
			const type = this.getNodeParameter('type', index) as string;
			const referenceNbr = this.getNodeParameter('referenceNbr', index) as string;
			const lineNbr = this.getNodeParameter('lineNbr', index) as number;

			const body = {
				Type: { value: type },
				ReferenceNbr: { value: referenceNbr },
				DocumentsToApply: [
					{
						LineNbr: { value: lineNbr },
						delete: true,
					},
				],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/Payment', body);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Payment`);
	}

	return prepareOutput.call(this, responseData, simplify);
}
