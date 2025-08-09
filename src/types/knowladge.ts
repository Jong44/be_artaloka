export interface Knowledge {
    id_knowledge: string;
    id_user: string;
    source_type: string;
    category: string;
    content: string;
    embeddings: string;
    metadata: string;
    created_at: string;
}

export interface DataIngestationInternalData {
  userId: string;
  data: {
    category: string;
    content: string;
    metadata?: Record<string, any>;
  };
}

