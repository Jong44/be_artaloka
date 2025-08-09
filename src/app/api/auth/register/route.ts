import { UserService } from "@/services/user_service";

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();
        const userService = new UserService();

        // Create user
        const user = await userService.createUser(name, email, password);
        if (!user) {
            return new Response(JSON.stringify({ error: "User creation failed" }), { status: 400 });
        }
        return new Response(JSON.stringify({ message: "User created successfully", user }), { status: 201 });
        
    } catch (error) {
        console.error("Error in user registration:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500 });
    }
}