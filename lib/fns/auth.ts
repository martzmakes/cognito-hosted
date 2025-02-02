import { APIGatewayEvent } from "aws-lambda";
import { decode, JwtPayload, verify } from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";

const JWKS_URL = `https://cognito-idp.us-east-1.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`;
const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  jwksUri: JWKS_URL,
});

// Extract the token from the "Cookie" header
const extractTokenFromCookies = (cookieHeader?: string): string | null => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split("; ").reduce((acc: any, item: string) => {
    const [key, value] = item.split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies["CognitoIdToken"] || null;
};

const getSigningKey = async (
  client: JwksClient,
  kid: string
): Promise<jwksClient.SigningKey> => {
  return new Promise<jwksClient.SigningKey>((res, rej) => {
    client.getSigningKey(kid, (err, key) => {
      if (err || !key) {
        rej(err);
      } else {
        res(key);
      }
    });
  });
};

// Verify the JWT token
const verifyJwt = async (token: string): Promise<JwtPayload> => {
  const decoded = decode(token, { complete: true, json: true });
  console.log(JSON.stringify({ decoded }));

  if (!decoded || !decoded.header.kid) {
    throw new Error("Invalid token");
  }
  const key = await getSigningKey(client, decoded.header.kid);
  const signingKey = key.getPublicKey();
  if (!key) {
    throw new Error("Invalid key identifier");
  }

  return verify(token, signingKey) as JwtPayload;
};

export const handler = async (event: APIGatewayEvent): Promise<any> => {
  console.log(JSON.stringify(event));
  try {
    const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
    const token = extractTokenFromCookies(cookieHeader);
    console.log("Token:", token);

    if (!token) {
      console.log("No ID token found in cookies");
      throw new Error("Unauthorized");
    }

    const decodedJwt = await verifyJwt(token);
    console.log(JSON.stringify(decodedJwt));
    return {
      principalId: decodedJwt.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: (event as any).methodArn?.split("/")[0] + "/prod/*",
          },
        ],
      },
      context: {
        email: decodedJwt.email,
        username: decodedJwt["cognito:username"],
      },
    };
  } catch (error) {
    console.error("Authorization error:", error);
    throw new Error("Unauthorized");
  }
};
