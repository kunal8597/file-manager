import { NextRequest , NextResponse } from "next/server";
import {S3Client , ListObjectsV2Command}  from "@aws-sdk/client-s3"

const s3 = new S3Client({
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string
    }
})

export async function GET(request: NextRequest) {
    const Prefix = request.nextUrl.searchParams.get("Prefix") ?? undefined
    const command = new ListObjectsV2Command({
        Bucket: "s3bucket-kunal8597",
        Prefix : "",  
        Delimiter : '/'     
    })
    const result = await s3.send(command)
    console.log("result : " ,result)

    const data = []
    const modifiedResponse = result?.Contents?.map((item) => ({
        key : item.Key,
        lastModified : item.LastModified,
        size : item.Size      
    }));
    const response = data.push(modifiedResponse)
    console.log("response : ",response)
    return NextResponse.json({
        status  : 200,
        message  : "success",
        data : modifiedResponse

    })
       
}
