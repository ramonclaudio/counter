import { createAuthClient } from "better-auth/react";
import { usernameClient, emailOTPClient } from "better-auth/client/plugins";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { env } from "./env";

const rawScheme = Constants.expoConfig?.scheme;
const scheme = Array.isArray(rawScheme) ? rawScheme[0] : rawScheme;

const client = createAuthClient({
  baseURL: env.convexSiteUrl,
  plugins: [
    convexClient(),
    usernameClient(),
    emailOTPClient(),
    expoClient({ scheme, storagePrefix: scheme ?? "better-auth", storage: SecureStore }),
  ],
});

type UsernameSignIn = (data: {
  username: string;
  password: string;
}) => Promise<{ data: unknown; error: { message: string } | null }>;

type SignInWithPlugins = typeof client.signIn & { username: UsernameSignIn };

export const authClient = client;
export const signInWithUsername = (client.signIn as SignInWithPlugins).username;
