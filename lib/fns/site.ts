export const handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    },
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
        
    </script>
</head>
<body>
    <h1>Welcome to Your Lambda-Powered Page</h1>
    <p>This page is dynamically served by an AWS Lambda function.</p>

    <div>
        <button id="signIn">Sign In</button>
    </div>
    
    <div>
        <h2>API Response</h2>
        <pre id="api-response">No data yet</pre>
    </div>

    <div>
        <button id="refetch">re-fetch</button>
    </div>

    <div>
        <h2>Token</h2>
        <pre id="token">No token yet</pre>
    </div>

    <div>
        <h2>Error</h2>
        <pre id="error"></pre>
    </div>
    
    <script type="module">
        export async function signOutRedirect() {
            const clientId = "793i9lsu16k0lop31pshj17jo";
            const logoutUri = "https://cognito.martzmakes.com/home";
            const cognitoDomain = "https://martzmakes-example.auth.us-east-1.amazoncognito.com";
            window.location.href = \`\${cognitoDomain}/logout?client_id=\${clientId}&logout_uri=\${encodeURIComponent(logoutUri)}\`;
        }

        function setCookie(name, value, days) {
            try {
                let expires = "";
                if (days) {
                    const date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = name + "=" + value + "; path=/" + expires;
            } catch (e) {
                document.getElementById("error").textContent = e;
                console.error(e);
                throw e;
            }
        }

        function getCookie(name) {
            try {
                const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                return match ? match[2] : null;
            } catch (e) {
                document.getElementById("error").textContent = e;
                console.error(e);
                throw e;
            }
        }

        function parseHashParams() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const idToken = params.get("id_token");
            const accessToken = params.get("access_token");
            const expiresIn = params.get("expires_in");
            
            if (idToken && accessToken) {
                setCookie("CognitoIdToken", idToken, expiresIn / 86400);
                setCookie("CognitoAccessToken", accessToken, expiresIn / 86400);
                window.location.hash = "";
            }
        }

        if (window.location.pathname === "/home") {
            parseHashParams();
        }

        if (window.location.pathname !== "/home" && !getCookie('CognitoAccessToken')) {
            window.location.href = "https://martzmakes-example.auth.us-east-1.amazoncognito.com/login?client_id=793i9lsu16k0lop31pshj17jo&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https%3A%2F%2Fcognito.martzmakes.com%2Fhome";
        }
        
        document.getElementById("signIn").addEventListener("click", async () => {
            window.location.href = "https://martzmakes-example.auth.us-east-1.amazoncognito.com/login?client_id=793i9lsu16k0lop31pshj17jo&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https%3A%2F%2Fcognito.martzmakes.com%2Fhome";
        });

        async function fetchAPIData() {
            const idToken = getCookie("CognitoIdToken");
            if (!idToken) {
                document.getElementById("api-response").textContent = "No access token found.";
                document.getElementById("token").textContent = "No token";
                return;
            }
            document.getElementById("token").textContent = idToken;
            try {
                const response = await fetch('/api/hello', {
                    headers: { 'Authorization': \`Bearer \${idToken}\` }
                });
                const data = await response.json();
                document.getElementById("api-response").textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById("api-response").textContent = \`Error fetching API: \${error.message}\`;
            }
        }

        document.getElementById("refetch").addEventListener("click", async () => {
            document.getElementById("token").textContent = "Checking...";
            fetchAPIData();
        });

        fetchAPIData();
    </script>
</body>
</html>`,
  };
};
