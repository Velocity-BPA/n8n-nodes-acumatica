/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	parseDate,
	formatAcumaticaDate,
	validateRequiredFields,
	cleanEmptyValues,
	parseLineItems,
} from '../../nodes/Acumatica/utils/helpers';

describe('Helper Functions', () => {
	describe('parseDate', () => {
		it('should parse ISO date string', () => {
			const result = parseDate('2024-01-15T10:30:00Z');
			expect(result).toBeInstanceOf(Date);
		});

		it('should parse date-only string', () => {
			const result = parseDate('2024-01-15');
			expect(result).toBeInstanceOf(Date);
		});

		it('should return null for invalid date', () => {
			const result = parseDate('invalid-date');
			expect(result).toBeNull();
		});

		it('should return null for empty string', () => {
			const result = parseDate('');
			expect(result).toBeNull();
		});
	});

	describe('formatAcumaticaDate', () => {
		it('should format date object to ISO string', () => {
			const date = new Date('2024-01-15T10:30:00Z');
			const result = formatAcumaticaDate(date);
			expect(result).toMatch(/2024-01-15/);
		});

		it('should handle string input', () => {
			const result = formatAcumaticaDate('2024-01-15');
			expect(result).toMatch(/2024-01-15/);
		});
	});

	describe('validateRequiredFields', () => {
		it('should pass when all required fields are present', () => {
			const data = { field1: 'value1', field2: 'value2' };
			const required = ['field1', 'field2'];
			expect(() => validateRequiredFields(data, required)).not.toThrow();
		});

		it('should throw when required field is missing', () => {
			const data = { field1: 'value1' };
			const required = ['field1', 'field2'];
			expect(() => validateRequiredFields(data, required)).toThrow('Missing required field: field2');
		});

		it('should throw when required field is empty', () => {
			const data = { field1: 'value1', field2: '' };
			const required = ['field1', 'field2'];
			expect(() => validateRequiredFields(data, required)).toThrow('Missing required field: field2');
		});
	});

	describe('cleanEmptyValues', () => {
		it('should remove empty string values', () => {
			const data = { field1: 'value1', field2: '', field3: 'value3' };
			const result = cleanEmptyValues(data);
			expect(result).toEqual({ field1: 'value1', field3: 'value3' });
		});

		it('should remove null values', () => {
			const data = { field1: 'value1', field2: null, field3: 'value3' };
			const result = cleanEmptyValues(data);
			expect(result).toEqual({ field1: 'value1', field3: 'value3' });
		});

		it('should remove undefined values', () => {
			const data = { field1: 'value1', field2: undefined, field3: 'value3' };
			const result = cleanEmptyValues(data);
			expect(result).toEqual({ field1: 'value1', field3: 'value3' });
		});

		it('should keep zero values', () => {
			const data = { field1: 'value1', field2: 0, field3: 'value3' };
			const result = cleanEmptyValues(data);
			expect(result).toEqual({ field1: 'value1', field2: 0, field3: 'value3' });
		});

		it('should keep false values', () => {
			const data = { field1: 'value1', field2: false, field3: 'value3' };
			const result = cleanEmptyValues(data);
			expect(result).toEqual({ field1: 'value1', field2: false, field3: 'value3' });
		});
	});

	describe('parseLineItems', () => {
		it('should parse JSON string to array', () => {
			const jsonString = '[{"InventoryID": "ITEM001", "Quantity": 10}]';
			const result = parseLineItems(jsonString);
			expect(result).toEqual([{ InventoryID: 'ITEM001', Quantity: 10 }]);
		});

		it('should return array as-is', () => {
			const array = [{ InventoryID: 'ITEM001', Quantity: 10 }];
			const result = parseLineItems(array);
			expect(result).toEqual(array);
		});

		it('should return empty array for invalid JSON', () => {
			const result = parseLineItems('invalid json');
			expect(result).toEqual([]);
		});

		it('should return empty array for empty string', () => {
			const result = parseLineItems('');
			expect(result).toEqual([]);
		});
	});
});
