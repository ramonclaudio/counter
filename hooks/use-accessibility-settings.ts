import { useState, useEffect } from "react";
import { AccessibilityInfo } from "react-native";

interface AccessibilitySettings {
  boldText: boolean;
  reduceTransparency: boolean;
}

const defaultSettings: AccessibilitySettings = {
  boldText: false,
  reduceTransparency: false,
};

export function useAccessibilitySettings(): AccessibilitySettings {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      const [boldText, reduceTransparency] = await Promise.all([
        AccessibilityInfo.isBoldTextEnabled(),
        AccessibilityInfo.isReduceTransparencyEnabled(),
      ]);

      setSettings({ boldText, reduceTransparency });
    };

    fetchSettings();

    const subscriptions = [
      AccessibilityInfo.addEventListener("boldTextChanged", (value) =>
        setSettings((prev) => ({ ...prev, boldText: value })),
      ),
      AccessibilityInfo.addEventListener("reduceTransparencyChanged", (value) =>
        setSettings((prev) => ({ ...prev, reduceTransparency: value })),
      ),
    ];

    return () => subscriptions.forEach((sub) => sub.remove());
  }, []);

  return settings;
}
