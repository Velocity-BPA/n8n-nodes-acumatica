/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import {
	customerOperations,
	customerFields,
	executeCustomerOperation,
} from './actions/Customer';

import {
	salesOrderOperations,
	salesOrderFields,
	executeSalesOrderOperation,
} from './actions/SalesOrder';

import {
	itemOperations,
	itemFields,
	executeItemOperation,
} from './actions/Item';

import {
	invoiceOperations,
	invoiceFields,
	executeInvoiceOperation,
} from './actions/Invoice';

import {
	vendorOperations,
	vendorFields,
	executeVendorOperation,
} from './actions/Vendor';

import {
	purchaseOrderOperations,
	purchaseOrderFields,
	executePurchaseOrderOperation,
} from './actions/PurchaseOrder';

import {
	paymentOperations,
	paymentFields,
	executePaymentOperation,
} from './actions/Payment';

import {
	billOperations,
	billFields,
	executeBillOperation,
} from './actions/Bill';

import {
	journalTransactionOperations,
	journalTransactionFields,
	executeJournalTransactionOperation,
} from './actions/JournalTransaction';

import {
	shipmentOperations,
	shipmentFields,
	executeShipmentOperation,
} from './actions/Shipment';

import {
	genericInquiryOperations,
	genericInquiryFields,
	executeGenericInquiryOperation,
} from './actions/GenericInquiry';

import {
	businessAccountOperations,
	businessAccountFields,
	executeBusinessAccount,
} from './actions/BusinessAccount';

export class Acumatica implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Acumatica',
		name: 'acumatica',
		icon: 'file:acumatica.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Acumatica Cloud ERP API',
		defaults: {
			name: 'Acumatica',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'acumaticaOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Bill',
						value: 'bill',
						description: 'Manage AP Bills',
					},
					{
						name: 'Business Account',
						value: 'businessAccount',
						description: 'Manage CRM Business Accounts',
					},
					{
						name: 'Customer',
						value: 'customer',
						description: 'Manage AR Customers',
					},
					{
						name: 'Generic Inquiry',
						value: 'genericInquiry',
						description: 'Execute Generic Inquiries',
					},
					{
						name: 'Invoice',
						value: 'invoice',
						description: 'Manage AR Invoices',
					},
					{
						name: 'Item',
						value: 'item',
						description: 'Manage Stock Items',
					},
					{
						name: 'Journal Transaction',
						value: 'journalTransaction',
						description: 'Manage GL Journal Transactions',
					},
					{
						name: 'Payment',
						value: 'payment',
						description: 'Manage AR Payments',
					},
					{
						name: 'Purchase Order',
						value: 'purchaseOrder',
						description: 'Manage Purchase Orders',
					},
					{
						name: 'Sales Order',
						value: 'salesOrder',
						description: 'Manage Sales Orders',
					},
					{
						name: 'Shipment',
						value: 'shipment',
						description: 'Manage Shipments',
					},
					{
						name: 'Vendor',
						value: 'vendor',
						description: 'Manage AP Vendors',
					},
				],
				default: 'customer',
			},
			// Customer operations and fields
			...customerOperations,
			...customerFields,
			// Sales Order operations and fields
			...salesOrderOperations,
			...salesOrderFields,
			// Item operations and fields
			...itemOperations,
			...itemFields,
			// Invoice operations and fields
			...invoiceOperations,
			...invoiceFields,
			// Vendor operations and fields
			...vendorOperations,
			...vendorFields,
			// Purchase Order operations and fields
			...purchaseOrderOperations,
			...purchaseOrderFields,
			// Payment operations and fields
			...paymentOperations,
			...paymentFields,
			// Bill operations and fields
			...billOperations,
			...billFields,
			// Journal Transaction operations and fields
			...journalTransactionOperations,
			...journalTransactionFields,
			// Shipment operations and fields
			...shipmentOperations,
			...shipmentFields,
			// Generic Inquiry operations and fields
			...genericInquiryOperations,
			...genericInquiryFields,
			// Business Account operations and fields
			...businessAccountOperations,
			...businessAccountFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: IDataObject | IDataObject[];

				switch (resource) {
					case 'customer':
						result = await executeCustomerOperation.call(this, operation, i);
						break;
					case 'salesOrder':
						result = await executeSalesOrderOperation.call(this, operation, i);
						break;
					case 'item':
						result = await executeItemOperation.call(this, operation, i);
						break;
					case 'invoice':
						result = await executeInvoiceOperation.call(this, operation, i);
						break;
					case 'vendor':
						result = await executeVendorOperation.call(this, operation, i);
						break;
					case 'purchaseOrder':
						result = await executePurchaseOrderOperation.call(this, operation, i);
						break;
					case 'payment':
						result = await executePaymentOperation.call(this, operation, i);
						break;
					case 'bill':
						result = await executeBillOperation.call(this, operation, i);
						break;
					case 'journalTransaction':
						result = await executeJournalTransactionOperation.call(this, operation, i);
						break;
					case 'shipment':
						result = await executeShipmentOperation.call(this, operation, i);
						break;
					case 'genericInquiry':
						result = await executeGenericInquiryOperation.call(this, operation, i);
						break;
					case 'businessAccount':
						result = await executeBusinessAccount.call(this, operation, i);
						break;
					default:
						throw new Error(`Resource '${resource}' is not supported`);
				}

				if (Array.isArray(result)) {
					returnData.push(...result.map((item) => ({ json: item })));
				} else {
					returnData.push({ json: result });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
