import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

const OpenAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt, amount = 1, resolution = "512x512" } = body;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!OpenAi.apiKey) {
      return new NextResponse("OpenAI API Key not configured", { status: 500 });
    }
    if (!prompt) {
      return new NextResponse("prompt is required ", { status: 400 });
    }
    if (!amount) {
      return new NextResponse("Amount is required ", { status: 400 });
    }
    if (!resolution) {
      return new NextResponse("resolution is required ", { status: 400 });
    }
    const freeTrail = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrail && !isPro) {
      return new NextResponse("free trail has expired.", { status: 403 });
    }

    const response = await OpenAi.images.generate({
      prompt,
      n: parseInt(amount, 10),
      size: resolution,
    });

    if (!isPro) {
      await incrementApiLimit();
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.log("[IMAGE_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
