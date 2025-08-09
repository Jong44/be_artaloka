import { UserService } from "@/services/user_service";
export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const userService = new UserService();

        // Login user
        const user = await userService.loginUser(email, password);
        if (!user) {
            return new Response(JSON.stringify({ error: "Login failed" }), { status: 400 });
        }
        return new Response(JSON.stringify({ success: true, message: "Login successful", data: user }), { status: 200 });
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            if (error.message.includes("Invalid login credentials")) {
                return new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 });
            }
            if (error.message.includes("User not found")) {
                return new Response(JSON.stringify({ success: false, message: "User not found" }), { status: 404 });
            }
            if (error.message.includes("Email not confirmed")) {
                return new Response(JSON.stringify({ success: false, message: "Email not confirmed, please check your inbox" }), { status: 403 });
            }

            if (error.message.includes("User already exists")) {
                return new Response(JSON.stringify({ success: false, message: "User already exists" }), { status: 409 });
            }
            if (error.message.includes("Network error")) {
                return new Response(JSON.stringify({ success: false, message: "Network error, please try again later" }), { status: 503 });
            }
        }
        return new Response(JSON.stringify({ success: false, message: "An unexpected error occurred" }), { status: 500 });
    }
}