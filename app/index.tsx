import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

const slides = [
  {
    label: "Project Control",
    title: "Build with verified engineers, supervisors, and suppliers.",
    body: "Create a project, assign the right team, track milestones, and keep every decision visible from your phone.",
    icon: "business-outline" as const,
  },
  {
    label: "Milestones & BOQ",
    title: "Turn site work into clear milestones and material requests.",
    body: "Engineers prepare BOQs, publish RFQs, compare supplier quotes, and upload real progress from the field.",
    icon: "construct-outline" as const,
  },
  {
    label: "Escrow & Delivery",
    title: "Release payments after proof, inspection, and delivery.",
    body: "Supervisors approve progress, clients release milestone payments, and suppliers manage purchase orders.",
    icon: "shield-checkmark-outline" as const,
  },
];

export default function Index() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.SURFACE }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View
            style={{
              backgroundColor: COLORS.SURFACE,
              borderRadius: 0,
              flex: 1,
              overflow: "hidden",
              padding: 24,
              shadowColor: "#064E3B",
              shadowOpacity: 0,
              shadowRadius: 24,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View
                style={{
                  backgroundColor: COLORS.INK,
                  borderBottomRightRadius: 18,
                  borderTopRightRadius: 18,
                  height: 28,
                  width: 16,
                }}
              />
              <Text style={{ color: COLORS.TEXT_LIGHT, fontWeight: "800" }}>
                {active + 1}/3
              </Text>
            </View>

            <View style={{ height: 290, justifyContent: "center", marginTop: 8 }}>
              <View
                style={{
                  backgroundColor: "#8BCDC1",
                  height: 78,
                  position: "absolute",
                  right: -12,
                  top: 82,
                  transform: [{ rotate: "-10deg" }],
                  width: "86%",
                }}
              />
              <View
                style={{
                  backgroundColor: COLORS.GOLD,
                  bottom: 42,
                  height: 76,
                  left: 22,
                  position: "absolute",
                  transform: [{ rotate: "-10deg" }],
                  width: "84%",
                }}
              />
              <View
                style={{
                  alignItems: "center",
                  alignSelf: "center",
                  backgroundColor: COLORS.PRIMARY_LIGHT,
                  borderRadius: 70,
                  height: 140,
                  justifyContent: "center",
                  width: 140,
                }}
              >
                <Ionicons name={slide.icon} size={74} color={COLORS.PRIMARY_DARK} />
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 12, fontWeight: "800" }}>
                {slide.label}
              </Text>
              <Text
                style={{
                  color: COLORS.TEXT_PRIMARY,
                  fontSize: 27,
                  fontWeight: "900",
                  lineHeight: 33,
                }}
              >
                {slide.title}
              </Text>
              <Text style={{ color: COLORS.TEXT_SECONDARY, fontSize: 14, lineHeight: 22 }}>
                {slide.body}
              </Text>
            </View>

            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 28,
              }}
            >
              <View style={{ flexDirection: "row", gap: 7 }}>
                {slides.map((item, index) => (
                  <Pressable
                    key={item.label}
                    onPress={() => setActive(index)}
                    style={{
                      backgroundColor: index === active ? COLORS.PRIMARY : COLORS.BORDER,
                      borderRadius: 999,
                      height: 8,
                      width: index === active ? 32 : 8,
                    }}
                  />
                ))}
              </View>
              <Pressable
                onPress={() => setActive((current) => (current + 1) % slides.length)}
                style={{
                  alignItems: "center",
                  backgroundColor: "#8BCDC1",
                  borderRadius: 10,
                  height: 44,
                  justifyContent: "center",
                  width: 68,
                }}
              >
                <Text style={{ color: COLORS.INK, fontWeight: "900" }}>Next</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 28 }}>
              <Link href="/(auth)/login" asChild>
                <Pressable
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.PRIMARY,
                    borderRadius: 14,
                    flex: 1,
                    paddingVertical: 15,
                  }}
                >
                  <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: "900" }}>
                    Login
                  </Text>
                </Pressable>
              </Link>
              <Link href="/(auth)/register" asChild>
                <Pressable
                  style={{
                    alignItems: "center",
                    backgroundColor: COLORS.MUTED,
                    borderRadius: 14,
                    flex: 1,
                    paddingVertical: 15,
                  }}
                >
                  <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "900" }}>
                    Create
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
