import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3"




const s3 = new S3Client({
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string
    }
})

export async function GET(request: NextRequest) {
    try {
        const key = request.nextUrl.searchParams.get('key') ?? undefined
        console.log("key : ", key)

        if (!key) {
            return NextResponse.json({
                status: 400,
                message: "Error Found"
            })
        }
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME as string,  // Use environment variable
            Key: key
        })





        const result = await getSignedUrl(s3, command, { expiresIn: 36000 })
          console.log("Result : ",result)

        return NextResponse.json({
            status: 200,
            message: "presigned URL",
            data: result

        })

    }
    catch (error: any) {
        return NextResponse.json({
            status: 500,
            message: error.message
        })
    }
}