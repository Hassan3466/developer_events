import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

function configureCloudinary(): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        );
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
}

function isSuccessfulCloudinaryDeletion(result: unknown): boolean {
    return (
        typeof result === "object" &&
        result !== null &&
        "result" in result &&
        (result.result === "ok" || result.result === "not found")
    );
}

type UploadedImage = {
    public_id: string;
    secure_url: string;
};

type EventFormData = {
    title: string;
    description: string;
    overview: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    organizer: string;
    tags: string[];
    agenda: string[];
};

function getRequiredText(formData: FormData, field: string): string {
    const value = formData.get(field);
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`The '${field}' field is required.`);
    }
    return value.trim();
}

function getStringArray(formData: FormData, field: string): string[] {
    let value: unknown;
    try {
        value = JSON.parse(getRequiredText(formData, field));
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`The '${field}' field must be a JSON array of strings.`);
        }
        throw error;
    }

    if (
        !Array.isArray(value) ||
        value.length === 0 ||
        !value.every((item: unknown) => typeof item === "string" && item.trim().length > 0)
    ) {
        throw new Error(`The '${field}' field must contain at least one non-empty string.`);
    }

    return value.map((item: string) => item.trim());
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        let eventData: EventFormData;
        try {
            eventData = {
                title: getRequiredText(formData, "title"),
                description: getRequiredText(formData, "description"),
                overview: getRequiredText(formData, "overview"),
                venue: getRequiredText(formData, "venue"),
                location: getRequiredText(formData, "location"),
                date: getRequiredText(formData, "date"),
                time: getRequiredText(formData, "time"),
                mode: getRequiredText(formData, "mode"),
                audience: getRequiredText(formData, "audience"),
                organizer: getRequiredText(formData, "organizer"),
                tags: getStringArray(formData, "tags"),
                agenda: getStringArray(formData, "agenda"),
            };
        } catch (error) {
            return NextResponse.json(
                { message: "Invalid event data.", error: error instanceof Error ? error.message : "Invalid input." },
                { status: 400 },
            );
        }

        const imageField = formData.get("image");
        if (
            !imageField ||
            typeof imageField === "string" ||
            typeof imageField.arrayBuffer !== "function" ||
            imageField.size === 0
        ) {
            return NextResponse.json(
                { message: "A non-empty image file is required in the 'image' field." },
                { status: 400 },
            );
        }
        const file = imageField;

        try {
            await new Event({ ...eventData, image: "pending-upload" }).validate();
        } catch (error) {
            return NextResponse.json(
                { message: "Invalid event data.", error: error instanceof Error ? error.message : "Invalid input." },
                { status: 400 },
            );
        }

        configureCloudinary();
        await connectDB();

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<UploadedImage>((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!results) {
                    reject(new Error("Cloudinary did not return an upload result."));
                    return;
                }
                resolve(results);
            }).end(buffer);
        });

        try {
            const createdEvent = await Event.create({
                ...eventData,
                image: uploadResult.secure_url,
            });
            return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 });
        } catch (creationError) {
            try {
                const storedEvent = await Event.exists({ image: uploadResult.secure_url });
                if (!storedEvent) {
                    const deletionResult: unknown = await cloudinary.uploader.destroy(
                        uploadResult.public_id,
                        { resource_type: "image" },
                    );
                    if (!isSuccessfulCloudinaryDeletion(deletionResult)) {
                        throw new Error("Cloudinary did not confirm image cleanup.");
                    }
                }
            } catch (cleanupError) {
                console.error(
                    "Event creation failed; the uploaded image was preserved because cleanup could not be confirmed.",
                    cleanupError,
                );
            }

            throw creationError;
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, { status: 500 })
    }
}

export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Event fetching failed', error: e }, { status: 500 });
    }
}