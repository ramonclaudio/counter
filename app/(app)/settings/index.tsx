import { View } from "react-native";
import Constants from "expo-constants";
import { Host, Form, Section, Button, Text, VStack, HStack, Spacer } from "@expo/ui/swift-ui";
import { font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";

import { haptics } from "@/lib/haptics";
import { authClient } from "@/lib/auth-client";

function ProfileHeader({ name, email }: { name: string; email: string }) {
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <VStack spacing={4} alignment="center">
      <Text modifiers={[font({ size: 44, weight: "bold", design: "rounded" }), foregroundStyle("white")]}>
        {initial}
      </Text>
      <Text modifiers={[font({ size: 17, weight: "semibold" })]}>{name}</Text>
      <Text modifiers={[font({ size: 14 }), foregroundStyle("secondary")]}>{email}</Text>
    </VStack>
  );
}

export default function SettingsScreen() {
  const { data: session } = authClient.useSession();

  const handleSignOut = () => {
    haptics.medium();
    authClient.signOut();
  };

  const handleHelp = () => {
    haptics.light();
  };

  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View style={{ flex: 1 }}>
      <Host style={{ flex: 1 }} useViewportSizeMeasurement>
        <Form>
          {session?.user && (
            <Section>
              <ProfileHeader name={session.user.name ?? ""} email={session.user.email} />
            </Section>
          )}

          <Section title="Account">
            <Button
              label="Sign Out"
              systemImage="rectangle.portrait.and.arrow.right"
              role="destructive"
              onPress={handleSignOut}
            />
          </Section>

          <Section title="Support">
            <Button
              label="Help & Feedback"
              systemImage="questionmark.circle"
              onPress={handleHelp}
            />
          </Section>

          <Section>
            <HStack>
              <Spacer />
              <Text modifiers={[font({ size: 12 }), foregroundStyle("tertiary")]}>
                Counter v{version}
              </Text>
              <Spacer />
            </HStack>
          </Section>
        </Form>
      </Host>
    </View>
  );
}
