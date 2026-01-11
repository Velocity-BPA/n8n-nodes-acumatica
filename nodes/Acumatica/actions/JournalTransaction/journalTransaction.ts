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

export const journalTransactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new GL journal entry',
				action: 'Create a journal transaction',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an unreleased journal entry',
				action: 'Delete a journal transaction',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a journal entry by batch number',
				action: 'Get a journal transaction',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many journal entries',
				action: 'Get many journal transactions',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a journal entry',
				action: 'Update a journal transaction',
			},
			{
				name: 'Add Line',
				value: 'addLine',
				description: 'Add a line to journal entry',
				action: 'Add journal line',
			},
			{
				name: 'Update Line',
				value: 'updateLine',
				description: 'Update a journal line',
				action: 'Update journal line',
			},
			{
				name: 'Delete Line',
				value: 'deleteLine',
				description: 'Delete a journal line',
				action: 'Delete journal line',
			},
			{
				name: 'Release',
				value: 'release',
				description: 'Release journal entry for posting',
				action: 'Release a journal transaction',
			},
			{
				name: 'Reverse',
				value: 'reverse',
				description: 'Create a reversing entry',
				action: 'Reverse a journal transaction',
			},
		],
		default: 'getAll',
	},
];

export const journalTransactionFields: INodeProperties[] = [
	// ----------------------------------
	//         journalTransaction: create
	// ----------------------------------
	{
		displayName: 'Module',
		name: 'module',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'General Ledger', value: 'GL' },
			{ name: 'Accounts Payable', value: 'AP' },
			{ name: 'Accounts Receivable', value: 'AR' },
			{ name: 'Cash Management', value: 'CA' },
			{ name: 'Inventory', value: 'IN' },
			{ name: 'Purchase Orders', value: 'PO' },
			{ name: 'Sales Orders', value: 'SO' },
		],
		default: 'GL',
		description: 'Module for the journal entry',
	},
	{
		displayName: 'Transaction Date',
		name: 'transactionDate',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Date of the journal entry',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Batch description',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				default: '',
				description: 'Branch for the journal entry',
			},
			{
				displayName: 'Currency ID',
				name: 'currencyId',
				type: 'string',
				default: '',
				description: 'Currency of the journal entry',
			},
			{
				displayName: 'Details (Journal Lines)',
				name: 'details',
				type: 'json',
				default: '[]',
				description: 'Journal lines: [{"Account": "1000", "DebitAmount": 100}, {"Account": "2000", "CreditAmount": 100}]',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: true,
				description: 'Whether to place journal entry on hold',
			},
			{
				displayName: 'Ledger ID',
				name: 'ledgerId',
				type: 'string',
				default: '',
				description: 'Ledger for posting',
			},
			{
				displayName: 'Post Period',
				name: 'postPeriod',
				type: 'string',
				default: '',
				description: 'Financial period for posting (e.g., 012024)',
			},
		],
	},

	// ----------------------------------
	//         journalTransaction: get
	// ----------------------------------
	{
		displayName: 'Module',
		name: 'module',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['get', 'delete', 'update', 'release', 'reverse', 'addLine', 'updateLine', 'deleteLine'],
			},
		},
		options: [
			{ name: 'General Ledger', value: 'GL' },
			{ name: 'Accounts Payable', value: 'AP' },
			{ name: 'Accounts Receivable', value: 'AR' },
			{ name: 'Cash Management', value: 'CA' },
			{ name: 'Inventory', value: 'IN' },
			{ name: 'Purchase Orders', value: 'PO' },
			{ name: 'Sales Orders', value: 'SO' },
		],
		default: 'GL',
		description: 'Module of the journal entry',
	},
	{
		displayName: 'Batch Number',
		name: 'batchNbr',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['get', 'delete', 'update', 'release', 'reverse', 'addLine', 'updateLine', 'deleteLine'],
			},
		},
		default: '',
		description: 'Journal batch number',
	},

	// ----------------------------------
	//         journalTransaction: update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Batch description',
			},
			{
				displayName: 'Hold',
				name: 'hold',
				type: 'boolean',
				default: false,
				description: 'Whether to place journal entry on hold',
			},
			{
				displayName: 'Post Period',
				name: 'postPeriod',
				type: 'string',
				default: '',
				description: 'Financial period for posting',
			},
			{
				displayName: 'Transaction Date',
				name: 'transactionDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the journal entry',
			},
		],
	},

	// ----------------------------------
	//         journalTransaction: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
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
				resource: ['journalTransaction'],
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
				resource: ['journalTransaction'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Module',
				name: 'module',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'General Ledger', value: 'GL' },
					{ name: 'Accounts Payable', value: 'AP' },
					{ name: 'Accounts Receivable', value: 'AR' },
					{ name: 'Cash Management', value: 'CA' },
				],
				default: '',
				description: 'Filter by module',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Balanced', value: 'Balanced' },
					{ name: 'Hold', value: 'Hold' },
					{ name: 'Posted', value: 'Posted' },
					{ name: 'Unposted', value: 'Unposted' },
					{ name: 'Voided', value: 'Voided' },
				],
				default: '',
				description: 'Filter by status',
			},
			{
				displayName: 'Ledger ID',
				name: 'ledgerId',
				type: 'string',
				default: '',
				description: 'Filter by ledger',
			},
			{
				displayName: 'Post Period',
				name: 'postPeriod',
				type: 'string',
				default: '',
				description: 'Filter by financial period (e.g., 012024)',
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Filter entries from this date',
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Filter entries up to this date',
			},
		],
	},

	// ----------------------------------
	//         journalTransaction: addLine
	// ----------------------------------
	{
		displayName: 'Journal Line',
		name: 'journalLine',
		type: 'collection',
		placeholder: 'Add Field',
		required: true,
		default: {},
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['addLine'],
			},
		},
		options: [
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				default: '',
				description: 'GL Account',
			},
			{
				displayName: 'Branch ID',
				name: 'branchId',
				type: 'string',
				default: '',
				description: 'Branch for the line',
			},
			{
				displayName: 'Credit Amount',
				name: 'creditAmount',
				type: 'number',
				default: 0,
				description: 'Credit amount',
			},
			{
				displayName: 'Debit Amount',
				name: 'debitAmount',
				type: 'number',
				default: 0,
				description: 'Debit amount',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Line description',
			},
			{
				displayName: 'Project',
				name: 'project',
				type: 'string',
				default: '',
				description: 'Project ID',
			},
			{
				displayName: 'Reference Number',
				name: 'refNbr',
				type: 'string',
				default: '',
				description: 'Reference number',
			},
			{
				displayName: 'Subaccount',
				name: 'subaccount',
				type: 'string',
				default: '',
				description: 'Subaccount segments',
			},
		],
	},

	// ----------------------------------
	//         journalTransaction: updateLine/deleteLine
	// ----------------------------------
	{
		displayName: 'Line Number',
		name: 'lineNbr',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
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
				resource: ['journalTransaction'],
				operation: ['updateLine'],
			},
		},
		options: [
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				default: '',
				description: 'GL Account',
			},
			{
				displayName: 'Credit Amount',
				name: 'creditAmount',
				type: 'number',
				default: 0,
				description: 'Credit amount',
			},
			{
				displayName: 'Debit Amount',
				name: 'debitAmount',
				type: 'number',
				default: 0,
				description: 'Debit amount',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Line description',
			},
		],
	},

	// ----------------------------------
	//         journalTransaction: reverse
	// ----------------------------------
	{
		displayName: 'Reversal Date',
		name: 'reversalDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['reverse'],
			},
		},
		default: '',
		description: 'Date for the reversing entry (defaults to original date if not specified)',
	},

	// ----------------------------------
	//         journalTransaction: options
	// ----------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['journalTransaction'],
				operation: ['get', 'getAll'],
			},
		},
		options: [
			{
				displayName: 'Expand',
				name: 'expand',
				type: 'multiOptions',
				options: [
					{ name: 'Details', value: 'Details' },
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

export async function executeJournalTransactionOperation(
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
			const module = this.getNodeParameter('module', index) as string;
			const transactionDate = this.getNodeParameter('transactionDate', index) as string;
			const description = this.getNodeParameter('description', index) as string;
			const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

			const bodyData: IDataObject = {
				Module: module,
				TransactionDate: transactionDate,
				Description: description,
			};

			if (additionalFields.details) {
				bodyData.Details = parseLineItems(additionalFields.details as string);
				delete additionalFields.details;
			}

			Object.assign(bodyData, additionalFields);
			const body = buildRequestBody(bodyData);

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/JournalTransaction', body);
			break;
		}

		case 'get': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;

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
				`/JournalTransaction/${module}/${encodeURIComponent(batchNbr)}`,
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
			if (filters.module) {
				filterParts.push(`Module eq '${filters.module}'`);
			}
			if (filters.status) {
				filterParts.push(`Status eq '${filters.status}'`);
			}
			if (filters.ledgerId) {
				filterParts.push(`LedgerID eq '${filters.ledgerId}'`);
			}
			if (filters.postPeriod) {
				filterParts.push(`PostPeriod eq '${filters.postPeriod}'`);
			}
			if (filters.dateFrom) {
				filterParts.push(`TransactionDate ge datetimeoffset'${filters.dateFrom}'`);
			}
			if (filters.dateTo) {
				filterParts.push(`TransactionDate le datetimeoffset'${filters.dateTo}'`);
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
				responseData = await acumaticaApiRequestAllItems.call(this, 'GET', '/JournalTransaction', {}, qs);
			} else {
				const limit = this.getNodeParameter('limit', index) as number;
				qs['$top'] = limit;
				responseData = await acumaticaApiRequest.call(this, 'GET', '/JournalTransaction', {}, qs);
			}
			break;
		}

		case 'update': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;
			const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

			const body = buildRequestBody({
				Module: module,
				BatchNbr: batchNbr,
				...updateFields,
			});

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/JournalTransaction', body);
			break;
		}

		case 'delete': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;

			responseData = await acumaticaApiRequest.call(
				this,
				'DELETE',
				`/JournalTransaction/${module}/${encodeURIComponent(batchNbr)}`,
			);
			responseData = { success: true };
			break;
		}

		case 'addLine': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;
			const journalLine = this.getNodeParameter('journalLine', index, {}) as IDataObject;

			const lineData: Record<string, { value: unknown }> = {};
			for (const [key, value] of Object.entries(journalLine)) {
				if (value !== '' && value !== null && value !== undefined) {
					const apiKey = key.charAt(0).toUpperCase() + key.slice(1);
					lineData[apiKey] = { value };
				}
			}

			const body = {
				Module: { value: module },
				BatchNbr: { value: batchNbr },
				Details: [lineData],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/JournalTransaction', body);
			break;
		}

		case 'updateLine': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;
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
				Module: { value: module },
				BatchNbr: { value: batchNbr },
				Details: [lineData],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/JournalTransaction', body);
			break;
		}

		case 'deleteLine': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;
			const lineNbr = this.getNodeParameter('lineNbr', index) as number;

			const body = {
				Module: { value: module },
				BatchNbr: { value: batchNbr },
				Details: [
					{
						LineNbr: { value: lineNbr },
						delete: true,
					},
				],
			};

			responseData = await acumaticaApiRequest.call(this, 'PUT', '/JournalTransaction', body);
			break;
		}

		case 'release': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;

			responseData = await acumaticaApiAction.call(
				this,
				'/JournalTransaction',
				'ReleaseJournalTransaction',
				{ Module: { value: module }, BatchNbr: { value: batchNbr } },
			);
			break;
		}

		case 'reverse': {
			const module = this.getNodeParameter('module', index) as string;
			const batchNbr = this.getNodeParameter('batchNbr', index) as string;
			const reversalDate = this.getNodeParameter('reversalDate', index, '') as string;

			const entity: Record<string, { value: unknown }> = {
				Module: { value: module },
				BatchNbr: { value: batchNbr },
			};

			const parameters: Record<string, { value: unknown }> = {};
			if (reversalDate) {
				parameters.ReversalDate = { value: reversalDate };
			}

			responseData = await acumaticaApiAction.call(
				this,
				'/JournalTransaction',
				'ReverseJournalTransaction',
				entity,
				parameters,
			);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for JournalTransaction`);
	}

	return prepareOutput.call(this, responseData, simplify);
}
