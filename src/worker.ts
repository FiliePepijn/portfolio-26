export interface Env {
  JMAP_SESSION_URL: string;
  JMAP_USERNAME: string;
  JMAP_APP_PASSWORD: string;
  JMAP_MAIL_FROM: string;
  JMAP_MAIL_FROM_NAME: string;
  FROM_EMAIL: string;
  CONTACT_EMAIL: string;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

type JmapSession = {
    apiUrl: string;
    primaryAccounts: Record<string, string>;
};

type JmapMethodResponse = [string, any, string?];

const JMAP_CORE_CAP = 'urn:ietf:params:jmap:core';
const JMAP_MAIL_CAP = 'urn:ietf:params:jmap:mail';

const getJmapAuthorizationHeader = (env: Env) => {
    const username = env.JMAP_USERNAME;
    const appPassword = env.JMAP_APP_PASSWORD;

    if (username && appPassword) {
        return `Basic ${btoa(`${username}:${appPassword}`)}`;
    }

    throw new Error('Configure JMAP_USERNAME and JMAP_APP_PASSWORD');
};

const getJmapSender = (env: Env) => {
    const email = env.JMAP_MAIL_FROM || env.FROM_EMAIL;
    const name = env.JMAP_MAIL_FROM_NAME || 'Pepijn Latour';

    if (!email) {
        throw new Error('JMAP_MAIL_FROM is not configured');
    }

    return { email, name };
};

const getJmapSession = async (env: Env) => {
    const sessionUrl = env.JMAP_SESSION_URL;
    const authorization = getJmapAuthorizationHeader(env);

    if (!sessionUrl) {
        throw new Error('JMAP_SESSION_URL is not configured');
    }

    const response = await fetch(sessionUrl, {
        headers: {
            Authorization: authorization,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch JMAP session: ${response.status} ${response.statusText}`);
    }

    const session = await response.json() as JmapSession;
    const accountId = session.primaryAccounts[JMAP_MAIL_CAP];

    if (!session.apiUrl || !accountId) {
        throw new Error('JMAP session is missing apiUrl or the mail accountId');
    }

    return {
        apiUrl: session.apiUrl,
        accountId,
        authorization,
    };
};

const createMultipartAlternativeBody = (text: string, html: string) => ({
    bodyStructure: {
        type: 'multipart/alternative',
        subParts: [
            {
                partId: 'text',
                type: 'text/plain',
            },
            {
                partId: 'html',
                type: 'text/html',
            },
        ],
    },
    bodyValues: {
        text: {
            value: text,
        },
        html: {
            value: html,
        },
    },
});

const postJmapMethodCalls = async (apiUrl: string, authorization: string, methodCalls: Array<[string, any, string?]>) => {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            using: [JMAP_CORE_CAP, JMAP_MAIL_CAP],
            methodCalls,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`JMAP request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<{ methodResponses?: JmapMethodResponse[] }>;
};

const resolveJmapIdentityId = async (apiUrl: string, authorization: string, accountId: string, senderEmail: string) => {
    const response = await postJmapMethodCalls(apiUrl, authorization, [[
        'Identity/get',
        {
            accountId,
            ids: null,
        },
        'c0',
    ]]);

    const identityResult = response.methodResponses?.find(([method]) => method === 'Identity/get')?.[1];
    const identities = identityResult?.list || [];
    const matchingIdentity = identities.find((identity: { id?: string; email?: string }) => {
        if (!identity?.email) {
            return false;
        }

        const normalizedIdentityEmail = identity.email.toLowerCase();
        const normalizedSenderEmail = senderEmail.toLowerCase();

        if (normalizedIdentityEmail.startsWith('*@')) {
            return normalizedSenderEmail.endsWith(normalizedIdentityEmail.slice(1));
        }

        return normalizedIdentityEmail === normalizedSenderEmail;
    });

    if (!matchingIdentity?.id) {
        throw new Error(`No JMAP identity found for ${senderEmail}`);
    }

    return matchingIdentity.id as string;
};

const resolveDraftMailboxId = async (apiUrl: string, authorization: string, accountId: string) => {
    const response = await postJmapMethodCalls(apiUrl, authorization, [[
        'Mailbox/get',
        {
            accountId,
            ids: null,
        },
        'm0',
    ]]);

    const mailboxResult = response.methodResponses?.find(([method]) => method === 'Mailbox/get')?.[1];
    const mailboxes = mailboxResult?.list || [];

    const draftMailbox = mailboxes.find((mailbox: { id?: string; role?: string; name?: string }) => mailbox?.role === 'drafts')
        || mailboxes.find((mailbox: { id?: string; role?: string; name?: string }) => mailbox?.name?.toLowerCase() === 'drafts');

    if (!draftMailbox?.id) {
        throw new Error('No drafts mailbox found for this JMAP account');
    }

    return draftMailbox.id as string;
};

const sendEmailViaJmap = async (env: Env, {
    to,
    subject,
    text,
    html,
    replyTo,
}: {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
}) => {
    const { apiUrl, accountId, authorization } = await getJmapSession(env);
    const sender = getJmapSender(env);
    const identityId = await resolveJmapIdentityId(apiUrl, authorization, accountId, sender.email);
    const draftsMailboxId = await resolveDraftMailboxId(apiUrl, authorization, accountId);

    const multipartBody = createMultipartAlternativeBody(text, html);

    const createResponse = await postJmapMethodCalls(apiUrl, authorization, [[
        'Email/set',
        {
            accountId,
            create: {
                draft: {
                    mailboxIds: {
                        [draftsMailboxId]: true,
                    },
                    from: [{ name: sender.name, email: sender.email }],
                    to: [{ email: to }],
                    ...(replyTo ? { replyTo: [{ email: replyTo }] } : {}),
                    subject,
                    bodyStructure: multipartBody.bodyStructure,
                    bodyValues: multipartBody.bodyValues,
                },
            },
        },
        'c1',
    ]]);

    const createdEmailResponse = createResponse.methodResponses?.find(([method]) => method === 'Email/set')?.[1];
    const createdEmailRecord = createdEmailResponse?.created ? Object.values(createdEmailResponse.created as Record<string, { id: string } | undefined>)[0] : undefined;
    const createdEmailId = createdEmailRecord?.id;

    if (!createdEmailId) {
        throw new Error(`JMAP did not return a created email id: ${JSON.stringify(createdEmailResponse)}`);
    }

    const submissionResponse = await postJmapMethodCalls(apiUrl, authorization, [[
        'EmailSubmission/set',
        {
            accountId,
            onSuccessDestroyEmail: [createdEmailId],
            create: {
                submission: {
                    identityId,
                    emailId: createdEmailId,
                    envelope: {
                        mailFrom: { email: sender.email },
                        rcptTo: [{ email: to }],
                    },
                },
            },
        },
        'c2',
    ]]);

    const submissionError = submissionResponse.methodResponses?.find(([method, result]) => method === 'EmailSubmission/set' && (result?.notCreated || result?.error));

    if (submissionError) {
        throw new Error(`JMAP submission failed: ${JSON.stringify(submissionError[1])}`);
    }
};

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // Handle the contact form submission
    if (url.pathname === '/api/send' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { name: string; email: string; message: string };
        const { name, email, message } = body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          return new Response(JSON.stringify({ success: false, error: 'Valid email is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!name || !message) {
          return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const adminSubject = 'SYSTEM_ALERT // NEW_TRANSMISSION';
        const adminHtmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: monospace, sans-serif; color: #ffffff;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 4px solid #FF7A00; border-collapse: collapse;">
                    <tr>
                        <td style="background-color: #FF7A00; padding: 10px 20px;">
                            <h1 style="margin: 0; font-size: 16px; font-weight: bold; color: #121212; text-transform: uppercase; letter-spacing: 2px;">SYSTEM_ALERT // NEW_TRANSMISSION</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,122,0,0.3);">
                                        <span style="font-size: 10px; color: #FF7A00; text-transform: uppercase; letter-spacing: 0.1em;">[IDENTIFIER]</span><br>
                                        <span style="font-size: 16px; font-weight: bold; text-transform: uppercase;">${name}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,122,0,0.3);">
                                        <span style="font-size: 10px; color: #FF7A00; text-transform: uppercase; letter-spacing: 0.1em;">[ENDPOINT]</span><br>
                                        <a href="mailto:${email}" style="font-size: 16px; color: #ffffff; text-decoration: none; border-bottom: 1px solid #FF7A00;">${email}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,122,0,0.3);">
                                        <span style="font-size: 10px; color: #FF7A00; text-transform: uppercase; letter-spacing: 0.1em;">[MESSAGE_PAYLOAD]</span><br>
                                        <p style="font-size: 14px; line-height: 1.6; margin: 8px 0 0 0; white-space: pre-wrap;">${message}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <span style="font-size: 10px; color: #FF7A00; text-transform: uppercase; letter-spacing: 0.1em;">[TIMESTAMP]</span><br>
                                        <span style="font-size: 14px; opacity: 0.7;">${new Date().toISOString()}</span>
                                    </td>
                                </tr>
                            </table>
                            <a href="mailto:${email}" style="display: block; margin-top: 30px; background-color: #FF7A00; color: #121212; text-decoration: none; padding: 15px; font-weight: bold; text-transform: uppercase; text-align: center; font-size: 18px; letter-spacing: 1px;">INITIATE_REPLY</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        const adminTextBody = `
SYSTEM_ALERT // NEW_TRANSMISSION

[IDENTIFIER]: ${name}
[ENDPOINT]: ${email}
[TIMESTAMP]: ${new Date().toISOString()}

[MESSAGE_PAYLOAD]:
${message}

---
Initiate Reply: ${email}
`;

        const userSubject = 'TRANSMISSION_RECEIVED // PEPIJN_LATOUR';
        const userHtmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: monospace, sans-serif; color: #ffffff;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 4px solid #FF7A00; border-collapse: collapse;">
                    <tr>
                        <td style="background-color: #FF7A00; padding: 20px 30px; text-align: center;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #121212; text-transform: uppercase; letter-spacing: 4px;">PEPIJN</h1>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #121212; font-weight: bold; letter-spacing: 2px;">UX/UI DESIGNER & WEB-DEVELOPER</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: bold; color: #FF7A00; text-transform: uppercase;">TRANSMISSION_SUCCESS</h2>
                            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; opacity: 0.9;">
                                Greeting ${name},<br><br>
                                Your data packet has been successfully received by the system. I will review the parameters and process a response within 24 standard cycles.
                            </p>

                            <div style="background-color: rgba(255,255,255,0.05); border-left: 2px solid #FF7A00; padding: 20px; margin-top: 30px;">
                                <h3 style="margin: 0 0 15px; font-size: 12px; font-weight: bold; color: #FF7A00; text-transform: uppercase; letter-spacing: 1px;">[PAYLOAD_SUMMARY]</h3>
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 5px 0; color: rgba(255,255,255,0.5); font-size: 12px; width: 100px;">ENDPOINT:</td>
                                        <td style="padding: 5px 0; font-size: 12px; font-weight: bold;">${email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: rgba(255,255,255,0.5); font-size: 12px; width: 100px;">TIMESTAMP:</td>
                                        <td style="padding: 5px 0; font-size: 12px;">${new Date().toISOString()}</td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #121212; border-top: 2px solid rgba(255,122,0,0.3); padding: 20px 30px; text-align: center;">
                            <p style="margin: 0 0 10px; font-size: 14px; font-weight: bold; color: #FF7A00; text-transform: uppercase;">PEPIJN_LATOUR</p>
                            <p style="margin: 0; font-size: 10px; opacity: 0.4; text-transform: uppercase; letter-spacing: 1px;">
                                END_OF_TRANSMISSION
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        const userTextBody = `
TRANSMISSION_SUCCESS // PEPIJN
UX/UI DESIGNER & WEB-DEVELOPER
============================================

Greeting ${name},

Your data packet has been successfully received by the system. I will review the parameters and process a response within 24 standard cycles.

[PAYLOAD_SUMMARY]
ENDPOINT: ${email}
TIMESTAMP: ${new Date().toISOString()}

============================================
PEPIJN_LATOUR
END_OF_TRANSMISSION
`;

        const hasJmapConfig = Boolean(env.JMAP_SESSION_URL && env.JMAP_USERNAME && env.JMAP_APP_PASSWORD && env.JMAP_MAIL_FROM);

        if (!hasJmapConfig) {
          console.warn('JMAP environment variables missing. Simulation mode active.');
          return new Response(JSON.stringify({ success: true, warning: 'JMAP not configured, email simulated.' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const adminRecipient = env.CONTACT_EMAIL || 'info@sitesculpt.net';

        // Send admin notification
        await sendEmailViaJmap(env, {
            to: adminRecipient,
            replyTo: email,
            subject: adminSubject,
            text: adminTextBody,
            html: adminHtmlBody,
        });

        // Send user confirmation
        await sendEmailViaJmap(env, {
            to: email,
            subject: userSubject,
            text: userTextBody,
            html: userHtmlBody,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        console.error('Email API error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Default: Serve frontend assets
    return env.ASSETS.fetch(request);
  },
};
