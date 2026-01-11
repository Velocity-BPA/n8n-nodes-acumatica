/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';

import { showLicenseNotice } from './utils/helpers';

export class AcumaticaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Acumatica Trigger',
		name: 'acumaticaTrigger',
		icon: 'file:acumatica.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when Acumatica push notification events occur',
		defaults: {
			name: 'Acumatica Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'acumaticaOAuth2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'salesOrder.created',
				options: [
					// Customer events
					{
						name: 'Customer Created',
						value: 'customer.created',
						description: 'Triggered when a new customer is created',
					},
					{
						name: 'Customer Updated',
						value: 'customer.updated',
						description: 'Triggered when a customer is updated',
					},
					// Sales Order events
					{
						name: 'Sales Order Created',
						value: 'salesOrder.created',
						description: 'Triggered when a new sales order is created',
					},
					{
						name: 'Sales Order Updated',
						value: 'salesOrder.updated',
						description: 'Triggered when a sales order is updated',
					},
					{
						name: 'Sales Order Shipped',
						value: 'salesOrder.shipped',
						description: 'Triggered when a sales order is shipped',
					},
					// Invoice events
					{
						name: 'Invoice Created',
						value: 'invoice.created',
						description: 'Triggered when an invoice is created',
					},
					{
						name: 'Invoice Released',
						value: 'invoice.released',
						description: 'Triggered when an invoice is released/posted',
					},
					// Payment events
					{
						name: 'Payment Received',
						value: 'payment.received',
						description: 'Triggered when a payment is received',
					},
					// Shipment events
					{
						name: 'Shipment Confirmed',
						value: 'shipment.confirmed',
						description: 'Triggered when a shipment is confirmed',
					},
					// Item events
					{
						name: 'Item Updated',
						value: 'item.updated',
						description: 'Triggered when a stock item is updated',
					},
					// Vendor events
					{
						name: 'Vendor Created',
						value: 'vendor.created',
						description: 'Triggered when a new vendor is created',
					},
					// Purchase Order events
					{
						name: 'Purchase Order Created',
						value: 'purchaseOrder.created',
						description: 'Triggered when a purchase order is created',
					},
					// Bill events
					{
						name: 'Bill Created',
						value: 'bill.created',
						description: 'Triggered when a vendor bill is created',
					},
					// All events
					{
						name: 'All Events',
						value: 'all',
						description: 'Triggered on any event',
					},
				],
				description: 'The event to listen for',
			},
			{
				displayName: 'Setup Instructions',
				name: 'setupNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						event: [
							'customer.created',
							'customer.updated',
							'salesOrder.created',
							'salesOrder.updated',
							'salesOrder.shipped',
							'invoice.created',
							'invoice.released',
							'payment.received',
							'shipment.confirmed',
							'item.updated',
							'vendor.created',
							'purchaseOrder.created',
							'bill.created',
							'all',
						],
					},
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-description-unneeded-backticks
				description: `To use this trigger, configure Push Notifications in Acumatica:
1. Navigate to Push Notifications (SM302000)
2. Create a new Push Notification
3. Set the Webhook URL to the URL shown below
4. Configure the query to monitor the relevant entity
5. Save and activate the notification`,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Deleted Records',
						name: 'includeDeleted',
						type: 'boolean',
						default: false,
						description: 'Whether to include deleted records in the output',
					},
					{
						displayName: 'Include Only Changed Fields',
						name: 'onlyChangedFields',
						type: 'boolean',
						default: false,
						description: 'Whether to include only the fields that changed (for update events)',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Push notifications in Acumatica need to be configured manually
				// This always returns true as the webhook URL is static
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// Push notifications in Acumatica need to be configured manually
				// Log the webhook URL for the user to configure
				const webhookUrl = this.getNodeWebhookUrl('default');
				console.log(`Acumatica Push Notification webhook URL: ${webhookUrl}`);
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// Push notifications in Acumatica need to be removed manually
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		showLicenseNotice();

		const body = this.getBodyData() as IDataObject;
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options', {}) as IDataObject;

		// Parse Acumatica push notification payload
		const query = body.Query as string || '';
		const inserted = body.Inserted as IDataObject[] || [];
		const deleted = body.Deleted as IDataObject[] || [];
		const notificationId = body.Id as string || '';
		const timestamp = body.TimeStamp as string || new Date().toISOString();
		const companyId = body.CompanyId as string || '';

		// Determine the event type from the query name
		let detectedEvent = 'unknown';
		const queryLower = query.toLowerCase();
		
		if (queryLower.includes('customer')) {
			detectedEvent = inserted.length > 0 ? 'customer.created' : 'customer.updated';
		} else if (queryLower.includes('salesorder')) {
			if (queryLower.includes('ship')) {
				detectedEvent = 'salesOrder.shipped';
			} else {
				detectedEvent = inserted.length > 0 ? 'salesOrder.created' : 'salesOrder.updated';
			}
		} else if (queryLower.includes('invoice')) {
			if (queryLower.includes('release')) {
				detectedEvent = 'invoice.released';
			} else {
				detectedEvent = 'invoice.created';
			}
		} else if (queryLower.includes('payment')) {
			detectedEvent = 'payment.received';
		} else if (queryLower.includes('shipment')) {
			detectedEvent = 'shipment.confirmed';
		} else if (queryLower.includes('item') || queryLower.includes('stock')) {
			detectedEvent = 'item.updated';
		} else if (queryLower.includes('vendor')) {
			detectedEvent = 'vendor.created';
		} else if (queryLower.includes('purchaseorder')) {
			detectedEvent = 'purchaseOrder.created';
		} else if (queryLower.includes('bill')) {
			detectedEvent = 'bill.created';
		}

		// Filter based on selected event
		if (event !== 'all' && event !== detectedEvent) {
			return {
				workflowData: [],
			};
		}

		// Prepare the output data
		const outputData: IDataObject[] = [];

		// Process inserted/updated records
		for (const record of inserted) {
			outputData.push({
				event: detectedEvent,
				action: 'inserted',
				query,
				companyId,
				notificationId,
				timestamp,
				data: record,
			});
		}

		// Process deleted records if option is enabled
		if (options.includeDeleted) {
			for (const record of deleted) {
				outputData.push({
					event: detectedEvent,
					action: 'deleted',
					query,
					companyId,
					notificationId,
					timestamp,
					data: record,
				});
			}
		}

		// If no records, still return the notification info
		if (outputData.length === 0) {
			outputData.push({
				event: detectedEvent,
				action: 'notification',
				query,
				companyId,
				notificationId,
				timestamp,
				raw: body,
			});
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray(outputData),
			],
		};
	}
}
