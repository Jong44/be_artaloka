export interface ChatSession {
    id_session: string; 
    id_user: string;
    message: Message[];
    created_at: string;
}

export interface Message {
    id_messages: string;
    id_session: string;
    role : string;
    content: string;
    metadata: string;
    created_at: string;
}


