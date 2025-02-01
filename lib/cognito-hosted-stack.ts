import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  AccessLogFormat,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  EndpointType,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import {
  CfnManagedLoginBranding,
  UserPool,
  ManagedLoginVersion,
  UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGateway } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { join } from "path";

export class CognitoHostedStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const baseDomain = "martzmakes.com";
    const clientBaseDomain = "cognito.martzmakes.com";
    const hostedZone = HostedZone.fromLookup(this, "hosted-zone", {
      domainName: baseDomain,
    });

    const certificate = new Certificate(this, "cert", {
      domainName: `${clientBaseDomain}`,
      validation: CertificateValidation.fromDns(hostedZone),
    });
    // const authDomain = `auth-${clientBaseDomain}`;
    // const authCert = new Certificate(this, "authCert", {
    //   domainName: authDomain,
    //   validation: CertificateValidation.fromDns(hostedZone),
    // });

    const userPool = new UserPool(this, "UserPool");
    const domainPrefix = "martzmakes-example";
    const domain = userPool.addDomain(
      "CognitoDomainWithBlandingDesignManagedLogin",
      {
        cognitoDomain: {
          domainPrefix,
        },
        // customDomain: {
        //   domainName: authDomain,
        //   certificate: authCert,
        // },
        managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
      }
    );

    const homeUrl = `https://${clientBaseDomain}/home`;
    const client = new UserPoolClient(this, "Client", {
      userPool,
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
        callbackUrls: [`https://${clientBaseDomain}`, homeUrl],
      },
    });

    new CfnManagedLoginBranding(this, "ManagedLoginBranding", {
      userPoolId: userPool.userPoolId,
      clientId: client.userPoolClientId,
      returnMergedResources: true,
      useCognitoProvidedValues: true,
    });

    domain.signInUrl(client, {
      redirectUri: homeUrl,
    });

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      `${id}UserPoolAuthorizer`,
      {
        cognitoUserPools: [userPool],
      }
    );

    const restApi = new RestApi(this, `Api`, {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      deployOptions: {
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new LogGroupLogDestination(
          new LogGroup(this, `/${id}AccessLogs`, {
            logGroupName: `/${id}-access`,
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
          })
        ),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: MethodLoggingLevel.INFO,
      },
    });

    restApi.addDomainName("domain", {
      domainName: clientBaseDomain,
      certificate,
    });

    new ARecord(this, "ARecord", {
      zone: hostedZone,
      recordName: clientBaseDomain,
      target: RecordTarget.fromAlias(new ApiGateway(restApi)),
    });

    const apiLogs = new LogGroup(this, `/${id}ApiLogs`, {
      logGroupName: `/${id}-api`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const apiFn = new NodejsFunction(this, "api", {
      entry: join(__dirname, "fns/api.ts"),
      runtime: Runtime.NODEJS_LATEST,
      logGroup: apiLogs,
      architecture: Architecture.ARM_64,
    });
    const apiResource = restApi.root.addResource("api");
    apiResource.addProxy({
      anyMethod: true,
      defaultIntegration: new LambdaIntegration(apiFn, { proxy: true }),
      defaultMethodOptions: {
        authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    });

    const logGroup = new LogGroup(this, `/${id}SiteLogs`, {
      logGroupName: `/${id}-site`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const fn = new NodejsFunction(this, "site", {
      entry: join(__dirname, "fns/site.ts"),
      runtime: Runtime.NODEJS_LATEST,
      logGroup,
      architecture: Architecture.ARM_64,
      environment: {
        AUTH_PREFIX: domainPrefix,
        BASE_DOMAIN: clientBaseDomain,
        USER_POOL_CLIENT_ID: client.userPoolClientId,
        USER_POOL_ID: userPool.userPoolId,
      }
    });

    const siteProxy = restApi.root.addProxy({
      anyMethod: false, // Disables automatic handling of all methods
    });
    siteProxy.addMethod("GET", new LambdaIntegration(fn));

    // Reject other methods (POST, PUT, DELETE, etc.) for the site proxy
    ["POST", "PUT", "DELETE", "PATCH"].forEach((method) => {
      siteProxy.addMethod(
        method,
        new MockIntegration({
          integrationResponses: [{ statusCode: "405" }], // Method Not Allowed
          passthroughBehavior: PassthroughBehavior.NEVER,
          requestTemplates: { "application/json": '{"statusCode": 405}' },
        }),
        { methodResponses: [{ statusCode: "405" }] }
      );
    });
  }
}
