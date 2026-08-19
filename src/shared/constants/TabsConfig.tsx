// TabsConfig.ts
import Calls from "@/assets/icons/calls.svg";
import Chats from "@/assets/icons/chats.svg";
import Settings from "@/assets/icons/settings.svg";
import { SvgProps } from "react-native-svg";
import { withUniwind } from "uniwind";

const CallsIcon = withUniwind(Calls);
const ChatsIcon = withUniwind(Chats);
const SettingsIcon = withUniwind(Settings);

export type TabRoute = "chats" | "calls" | "settings";
export interface TabConfig {
  name: TabRoute;
  label: string;
  icon: React.FC<SvgProps>;
  initialRoute?: string;
}

// Static layout — no colors here, since this file has no component to host the hook
export const TabBarLayout = {
  borderColor: "transparent",
  height: 90,
  paddingTop: 10,
  placeItems: "center",
  justifyContent: "center",
  alignItems: "center",
  placeContent: "center",
  alignSelf: "center",
  // position: "absolute",
} as const;

export const TabBarLabelSize = 12;

export const TABS: TabConfig[] = [
  { name: "calls", label: "Calls", icon: CallsIcon, initialRoute: "index" },
  { name: "chats", label: "Chats", icon: ChatsIcon, initialRoute: "index" },
  {
    name: "settings",
    label: "Settings",
    icon: SettingsIcon,
    initialRoute: "index",
  },
];

export const getTabConfig = (name: TabRoute): TabConfig | undefined =>
  TABS.find((t) => t.name === name);
