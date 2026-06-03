// components/project/ProjectCard.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";
 const goToProject = (id: string) => {
  router.push({
    pathname: "/(engineer)/project/[id]",
    params: { id },
  } as never);
};
export default function ProjectCard({
    
  project,
}: any) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        goToProject(project.id)
      }
    >
      <Text style={styles.name}>
        {project.name}
      </Text>

      <Text>{project.location}</Text>

      <Text>
        {project.budget.toLocaleString()} Rwf
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
  },
});
