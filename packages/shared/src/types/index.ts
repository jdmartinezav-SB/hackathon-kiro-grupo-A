// Consumer (Dev 1)
export interface Consumer {
  id: string;
  email: string;
  passwordHash: string;
  companyName: string;
  contactName: string;
  phone?: string;
  businessProfile: 'insurtech' | 'broker' | 'enterprise' | 'startup';
  status: 'active' | 'suspended' | 'revoked';
  role: 'consumer' | 'admin';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

// Application (Dev 1)
export interface Application {
  id: string;
  consumerId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'revoked';
  createdAt: Date;
}

// Credential (Dev 1)
export interface Credential {
  id: string;
  applicationId: string;
  clientId: string;
  clientSecretHash: string;
  environment: 'sandbox' | 'production';
  status: 'active' | 'revoked';
  createdAt: Date;
  revokedAt?: Date;
}

// SubscriptionPlan (Dev 1)
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  quotaLimit: number;
  quotaPeriod: 'daily' | 'monthly' | 'yearly';
  createdAt: Date;
}

// ApiDefinition (Dev 2)
export interface ApiDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: 'active' | 'deprecated' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

// ApiVersion (Dev 2)
export interface ApiVersion {
  id: string;
  apiDefinitionId: string;
  versionTag: string;
  openapiSpec: string;
  format: 'yaml' | 'json';
  status: 'active' | 'deprecated' | 'retired';
  semanticMetadata?: Record<string, unknown>;
  publishedAt: Date;
}

// SunsetPlan (Dev 2)
export interface SunsetPlan {
  id: string;
  apiVersionId: string;
  replacementVersionId?: string;
  sunsetDate: Date;
  migrationGuideUrl?: string;
  createdAt: Date;
}

// SandboxHistory (Dev 3)
export interface SandboxHistory {
  id: string;
  applicationId: string;
  apiVersionId: string;
  method: string;
  path: string;
  requestHeaders: Record<string, string>;
  requestBody?: Record<string, unknown>;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  responseTimeMs: number;
  correlationId: string;
  createdAt: Date;
}

// AuditLog (Dev 4)
export interface AuditLog {
  id: string;
  correlationId: string;
  consumerId: string;
  applicationId: string;
  apiVersionId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress: string;
  responseTimeMs: number;
  createdAt: Date;
}

// UsageMetric (Dev 4)
export interface UsageMetric {
  id: string;
  applicationId: string;
  apiVersionId: string;
  metricDate: Date;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  quotaUsed: number;
  updatedAt: Date;
}

// Notification (Dev 4)
export type NotificationType = 'new_version' | 'maintenance' | 'sunset' | 'quota_warning' | 'quota_exhausted' | 'general';
export type NotificationChannel = 'email' | 'portal';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  consumerId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
}

// JWT Payload
export interface JwtPayload {
  consumerId: string;
  email: string;
  role: string;
  businessProfile: string;
}

// API Response envelope
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  correlationId: string;
}

export interface ApiErrorResponse {
  error: ApiError;
  statusCode: number;
}
