import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    return NextResponse.json({
        message: "Hello, this is a test route!",
        timestamp: new Date().toISOString(),
        });
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    return NextResponse.json({
      message: "Data received successfully!",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}