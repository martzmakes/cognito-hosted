export const handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    },
    // basic index.html body
    body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lambda Response</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 50px;
        }
        h1 {
            color: #333;
        }
        p {
            color: #666;
        }
        pre {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            display: inline-block;
            text-align: left;
            max-width: 600px;
            word-wrap: break-word;
        }
    </style>
    <script type="module">
        import { UserManager } from 'https://cdn.jsdelivr.net/npm/oidc-client-ts/+esm';

        const cognitoAuthConfig = {
            authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_a5UE60BxN",
            client_id: "793i9lsu16k0lop31pshj17jo",
            redirect_uri: "https://cognito.martzmakes.com/home",
            response_type: "code",
            scope: "aws.cognito.signin.user.admin email openid phone profile"
        };

        export const userManager = new UserManager({
            ...cognitoAuthConfig,
        });

        export async function signOutRedirect() {
            const clientId = "793i9lsu16k0lop31pshj17jo";
            const logoutUri = "https://cognito.martzmakes.com/home";
            const cognitoDomain = "https://martzmakes-example.auth.us-east-1.amazoncognito.com";
            window.location.href = \`\${cognitoDomain}/logout?client_id=\${clientId}&logout_uri=\${encodeURIComponent(logoutUri)}\`;
        }
    </script>
</head>
<body>
    <h1>Welcome to Your Lambda-Powered Page</h1>
    <p>This page is dynamically served by an AWS Lambda function.</p>

    <div>
        <button id="signIn">Sign In</button>
    </div>
    
    <div>
        Hello: <pre id="email"></pre>
        Access token: <pre id="access-token"></pre>
        ID token: <pre id="id-token"></pre>
        Refresh token: <pre id="refresh-token"></pre>
    </div>

    <div>
        <button id="signOut">Log out</button>
    </div>

    <div>
        <h2>API Response</h2>
        <pre id="api-response">No data yet</pre>
    </div>

    <script type="module">
        document.getElementById("signIn").addEventListener("click", async () => {
            await userManager.signinRedirect();
        });

        userManager.signinCallback().then(async function (user) {
            document.getElementById("email").textContent = user.profile?.email;
            document.getElementById("access-token").textContent = user.access_token;
            document.getElementById("id-token").textContent = user.id_token;
            document.getElementById("refresh-token").textContent = user.refresh_token;
            
            // Fetch API data if user is logged in
            try {
                const response = await fetch('/api', {
                    headers: { 'Authorization': \`Bearer \${user.access_token}\` }
                });
                const data = await response.json();
                document.getElementById("api-response").textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById("api-response").textContent = \`Error fetching API: \${error.message}\`;
            }
        });

        document.getElementById("signOut").addEventListener("click", async () => {
            await signOutRedirect();
        });
    </script>
</body>
</html>`,
  };
};
