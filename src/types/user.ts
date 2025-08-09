export interface User {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    UserPersonalData?: UserPersonalData;
}

export interface UserPersonalData {
    city: string;
    gender: string;
    age: number;
    status: string;
    income: string;
    expense: string;
    is_savings: boolean;
    financial_goals: string;
    agent_role: string;
}

export interface UserBehavior {
    id_behavior: string;
    id_user: string;
    behavior_type: string;
    behavior_data: string;
    confident_score: number;
    created_at: string;
}