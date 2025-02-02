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
    <title>cognito-hosted | martzmakes</title>
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
        window.signOut = function () {
            document.cookie = "CognitoIdToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "https://${process.env.AUTH_PREFIX}.auth.us-east-1.amazoncognito.com/logout?client_id=${process.env.USER_POOL_CLIENT_ID}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https%3A%2F%2F${process.env.BASE_DOMAIN}";
        }
    </script>
</head>
<body>
    <div class="container">
        <h1>Welcome to a Protected, Lambda-Powered Page</h1>
        <button id="signOut" class="button sign-out" onclick="signOut()">Sign Out</button>
    </div>
</body>
</html>`,
  };
};
