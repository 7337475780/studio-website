import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Your Prisma client
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve(result as any);
        }
      );
      stream.end(buffer);
    }
  );

  await prisma.photo.create({
    data: { title, image_url: uploadResult.secure_url },
  });

  return NextResponse.json({ message: "Photo uploaded" });
}
