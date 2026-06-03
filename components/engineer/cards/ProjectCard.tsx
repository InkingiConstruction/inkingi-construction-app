import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { EngineerProject } from "../engineer-types";
import { money } from "../engineer-utils";

const goToProject = (id: string) => {
  router.push({
    pathname: "/(engineer)/project/[id]",
    params: { id },
  } as never);
};

export default function ProjectCard({
  project,
}: {
  project: EngineerProject;
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => goToProject(project.id)}
      activeOpacity={0.82}
    >
      <View style={styles.icon}>
        <Ionicons name="business-outline" size={22} color={COLORS.PRIMARY_DARK} />
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>{project.name}</Text>
        <Text numberOfLines={2} style={styles.meta}>
          {project.address || project.description || "Assigned construction project"}
        </Text>
        <Text style={styles.budget}>{money(project.budget, project.currency || "RWF")}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.TEXT_LIGHT} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 14,
  },
  icon: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 10,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  body: {
    flex: 1,
  },
  name: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  budget: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 7,
  },
});
