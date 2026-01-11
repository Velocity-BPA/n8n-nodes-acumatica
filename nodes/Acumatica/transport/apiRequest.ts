/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  ILoadOptionsFunctions,
  IRequestOptions,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';

interface AcumaticaCredentials {
  instanceUrl: string;
  apiVersion: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  companyName?: string;
  branchId?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

// Token cache with expiration
const tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

/**
 * Get OAuth2 access token using Resource Owner Password Credentials flow
 */
export async function getOAuthToken(
  this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  credentials: AcumaticaCredentials,
): Promise<string> {
  const cacheKey = `${credentials.instanceUrl}:${credentials.username}`;
  const cached = tokenCache.get(cacheKey);
  
  // Return cached token if still valid (with 5 minute buffer)
  if (cached && cached.expiresAt > Date.now() + 300000) {
    return cached.token;
  }

  const tokenUrl = `${credentials.instanceUrl}/identity/connect/token`;
  
  const formData: IDataObject = {
    grant_type: 'password',
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    username: credentials.username,
    password: credentials.password,
    scope: 'api offline_access',
  };

  // Add company name if specified
  if (credentials.companyName) {
    formData.username = `${credentials.username}@${credentials.companyName}`;
  }

  try {
    const response = await this.helpers.request({
      method: 'POST',
      uri: tokenUrl,
      form: formData,
      json: true,
    }) as TokenResponse;

    const token = response.access_token;
    const expiresIn = response.expires_in || 3600;
    
    // Cache the token
    tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + (expiresIn * 1000),
    });

    return token;
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Failed to authenticate with Acumatica: ${error.message}`,
      { description: 'Please check your credentials and ensure the Connected Application is properly configured.' },
    );
  }
}

/**
 * Clear token cache for a specific credential
 */
export function clearTokenCache(instanceUrl: string, username: string): void {
  const cacheKey = `${instanceUrl}:${username}`;
  tokenCache.delete(cacheKey);
}

/**
 * Make an API request to Acumatica
 */
export async function acumaticaApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
  uri?: string,
): Promise<IDataObject | IDataObject[]> {
  const credentials = await this.getCredentials('acumaticaOAuth2Api') as AcumaticaCredentials;
  const token = await getOAuthToken.call(this, credentials);

  // Normalize instance URL (remove trailing slash)
  const instanceUrl = credentials.instanceUrl.replace(/\/$/, '');
  const baseUrl = `${instanceUrl}/entity/Default/${credentials.apiVersion}`;

  const options: IRequestOptions = {
    method,
    uri: uri || `${baseUrl}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    json: true,
  };

  // Add branch header if specified
  if (credentials.branchId) {
    options.headers!['Branch'] = credentials.branchId;
  }

  if (body && Object.keys(body).length > 0) {
    options.body = body;
  }

  if (query && Object.keys(query).length > 0) {
    options.qs = query;
  }

  try {
    const response = await this.helpers.request(options);
    return response as IDataObject | IDataObject[];
  } catch (error) {
    // Handle specific Acumatica errors
    if (error.statusCode === 401) {
      // Token expired, clear cache and retry once
      clearTokenCache(credentials.instanceUrl, credentials.username);
      const newToken = await getOAuthToken.call(this, credentials);
      options.headers!['Authorization'] = `Bearer ${newToken}`;
      
      try {
        const response = await this.helpers.request(options);
        return response as IDataObject | IDataObject[];
      } catch (retryError) {
        throw new NodeApiError(this.getNode(), retryError);
      }
    }

    if (error.statusCode === 429) {
      throw new NodeOperationError(
        this.getNode(),
        'Rate limit exceeded. Please wait and try again.',
        { description: 'Acumatica has rate limiting in place. Consider adding delays between requests.' },
      );
    }

    throw new NodeApiError(this.getNode(), error);
  }
}

/**
 * Make an API request to Acumatica with pagination support
 */
export async function acumaticaApiRequestAllItems(
  this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
  limit?: number,
): Promise<IDataObject[]> {
  query = query || {};
  const results: IDataObject[] = [];
  let skip = 0;
  const top = Math.min(limit || 100, 500); // Max 500 per request

  do {
    query['$top'] = top;
    query['$skip'] = skip;

    const response = await acumaticaApiRequest.call(this, method, endpoint, body, query);

    if (Array.isArray(response)) {
      results.push(...response);
      
      // Check if we've reached the limit or got less than requested
      if (response.length < top || (limit && results.length >= limit)) {
        break;
      }
      skip += top;
    } else {
      // Single item response
      results.push(response);
      break;
    }
  } while (true);

  // Trim to limit if specified
  if (limit && results.length > limit) {
    return results.slice(0, limit);
  }

  return results;
}

/**
 * Execute an action on an entity (e.g., Release, Confirm)
 */
export async function acumaticaApiAction(
  this: IExecuteFunctions,
  endpoint: string,
  entityId: string,
  action: string,
  actionParameters?: IDataObject,
): Promise<IDataObject> {
  const actionBody: IDataObject = {
    entity: {
      id: entityId,
    },
    parameters: actionParameters || {},
  };

  return await acumaticaApiRequest.call(
    this,
    'POST',
    `${endpoint}/${action}`,
    actionBody,
  ) as IDataObject;
}

/**
 * Build OData filter string from parameters
 */
export function buildODataFilter(filters: IDataObject): string {
  const filterParts: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        filterParts.push(`${key} eq '${value}'`);
      } else if (typeof value === 'number') {
        filterParts.push(`${key} eq ${value}`);
      } else if (typeof value === 'boolean') {
        filterParts.push(`${key} eq ${value}`);
      }
    }
  }

  return filterParts.join(' and ');
}

/**
 * Format Acumatica value wrapper
 */
export function formatAcumaticaValue(value: unknown): { value: unknown } {
  return { value };
}

/**
 * Extract value from Acumatica response field
 */
export function extractValue(field: IDataObject | undefined): unknown {
  if (field && typeof field === 'object' && 'value' in field) {
    return field.value;
  }
  return field;
}

/**
 * Build request body with Acumatica value format
 */
export function buildRequestBody(data: IDataObject): IDataObject {
  const body: IDataObject = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // Handle arrays (like line items)
        body[key] = value.map((item) => {
          if (typeof item === 'object') {
            return buildRequestBody(item as IDataObject);
          }
          return formatAcumaticaValue(item);
        });
      } else if (typeof value === 'object') {
        // Nested object
        body[key] = buildRequestBody(value as IDataObject);
      } else {
        // Simple value
        body[key] = formatAcumaticaValue(value);
      }
    }
  }

  return body;
}

/**
 * Simplify Acumatica response by extracting values
 */
export function simplifyResponse(data: IDataObject): IDataObject {
  const simplified: IDataObject = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      simplified[key] = null;
    } else if (Array.isArray(value)) {
      simplified[key] = value.map((item) => {
        if (typeof item === 'object') {
          return simplifyResponse(item as IDataObject);
        }
        return item;
      });
    } else if (typeof value === 'object') {
      if ('value' in (value as IDataObject)) {
        simplified[key] = (value as IDataObject).value;
      } else {
        simplified[key] = simplifyResponse(value as IDataObject);
      }
    } else {
      simplified[key] = value;
    }
  }

  return simplified;
}

/**
 * Handle long-running operations with polling
 */
export async function pollOperation(
  this: IExecuteFunctions,
  statusUrl: string,
  maxAttempts = 60,
  intervalMs = 1000,
): Promise<IDataObject> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await acumaticaApiRequest.call(this, 'GET', '', undefined, undefined, statusUrl) as IDataObject;

    if (response.status === 'Completed') {
      return response;
    }

    if (response.status === 'Failed') {
      throw new NodeOperationError(
        this.getNode(),
        `Operation failed: ${response.message || 'Unknown error'}`,
      );
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new NodeOperationError(
    this.getNode(),
    'Operation timed out waiting for completion',
  );
}
