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
    <title>Lambda Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: #333;
        }
        .button {
            padding: 10px 20px;
            margin-top: 10px;
            font-size: 16px;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 5px;
        }
        .sign-in {
            background-color: #007bff;
        }
        .sign-out {
            background-color: #dc3545;
        }
        .hidden {
            display: none;
        }
    </style>
    <script type="module">
        function setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + value + "; path=/" + expires;
        }

        function getCookie(name) {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        }

        function parseHashParams() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const idToken = params.get("id_token");
            const expiresIn = params.get("expires_in");
            
            if (idToken) {
                setCookie("CognitoIdToken", idToken, expiresIn / 86400);
                window.location.hash = "";
            }
        }

        function updateUI() {
            const idToken = getCookie("CognitoIdToken");
            document.getElementById("signIn").classList.toggle("hidden", !!idToken);
            document.getElementById("signOut").classList.toggle("hidden", !idToken);
        }

        async function fetchAPIData() {
            const idToken = getCookie("CognitoIdToken");
            if (!idToken) return;
            try {
                const response = await fetch('/api/hello', {
                    headers: { 'Authorization': \`Bearer \${idToken}\` }
                });
                const data = await response.json();
                document.getElementById("api-response").textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById("api-response").textContent = "Error fetching API.";
            }
        }

        window.onload = () => {
            parseHashParams();
            updateUI();
            fetchAPIData();
        }

        window.signIn = function () {
            window.location.href = "https://${process.env.AUTH_PREFIX}.auth.us-east-1.amazoncognito.com/login?client_id=${process.env.USER_POOL_CLIENT_ID}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https%3A%2F%2F${process.env.BASE_DOMAIN}%2Fhome";
        }

        window.signOut = function () {
            document.cookie = "CognitoIdToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            updateUI();
            window.location.href = "https://${process.env.AUTH_PREFIX}.auth.us-east-1.amazoncognito.com/logout?client_id=${process.env.USER_POOL_CLIENT_ID}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https%3A%2F%2F${process.env.BASE_DOMAIN}";
        }
    </script>
</head>
<body>
    <div class="container">
        <h1>Welcome to a Lambda-Powered Page</h1>
        <button id="signIn" class="button sign-in" onclick="signIn()">Sign In</button>
        <button id="signOut" class="button sign-out hidden" onclick="signOut()">Sign Out</button>
        <h2>API Response</h2>
        <pre id="api-response">No data yet</pre>
    </div>
</body>
</html>`,
  };
};
