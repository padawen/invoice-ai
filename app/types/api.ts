export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  statusCode?: number;
}

export interface PrivacyProgressData {
  id: string;
  filename: string;
  status: 'started' | 'processing' | 'completed' | 'error';
  progress: number;
  stage: 'upload' | 'ocr' | 'llm' | 'postprocess';
  message: string;
  created_at: string;
  updated_at: string;
  stages: {
    upload: StageProgress;
    ocr: StageProgress;
    llm: StageProgress;
    postprocess: StageProgress;
  };
  error?: string;
  result?: InvoiceData;
}

export interface StageProgress {
  progress: number;
  status: string;
  duration?: number;
}

export interface OpenAIResponse {
  invoice_data: InvoiceItem[];
  seller: ContactInfo;
  buyer: ContactInfo;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  fulfillment_date?: string;
  payment_method?: string;
  currency?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate?: number;
  tax_amount?: number;
  net_amount?: number;
  gross_amount?: number;
}

export interface ContactInfo {
  name: string;
  address?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  bank_account?: string;
}

export interface InvoiceData extends OpenAIResponse {
  _processing_metadata?: ProcessingMetadata;
}

export interface ProcessingMetadata {
  job_id?: string;
  privacy_service?: boolean;
  processing_time?: number;
  extraction_method?: 'text' | 'image' | 'privacy';
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  message?: string;
  privacyApi?: Record<string, unknown>;
  url?: string;
  timestamp?: string;
  error?: string;
  envVar?: string;
}

export interface ProgressStreamEvent {
  event: 'progress' | 'complete' | 'error';
  data: PrivacyProgressData | { result: InvoiceData } | { error: string };
}

export interface ProxyRequestInit extends RequestInit {
  timeout?: number;
}

export interface TimeEstimationResponse {
  char_count: number;
  estimated_time_seconds: number;
  breakdown: {
    ocr: number;
    metadata_extraction: number;
    items_extraction: number;
  };
  note: string;
}
