import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const data = event.body
    console.log(data)

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'data processed'
        })
    }
}
