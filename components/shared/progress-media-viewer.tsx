import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { COLORS } from "@/constants/colors";

export type ProgressMedia = {
  url: string;
  isVideo?: boolean;
  title?: string;
  caption?: string | null;
};

export function ProgressMediaViewer({
  media,
  onClose,
}: {
  media: ProgressMedia | null;
  onClose: () => void;
}) {
  const [videoChromeVisible, setVideoChromeVisible] = useState(false);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const player = useVideoPlayer(media?.isVideo ? media.url : null, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    setVideoChromeVisible(false);
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [media?.url, savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

  useEffect(() => {
    if (!media?.isVideo) return undefined;

    const subscription = player.addListener("playToEnd", () => {
      onClose();
    });

    return () => {
      subscription.remove();
    };
  }, [media?.isVideo, onClose, player]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.01) {
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const imageGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal visible={Boolean(media)} animationType="fade" transparent>
      <View style={{ backgroundColor: media?.isVideo ? "#000000" : "rgba(15, 23, 42, 0.96)", flex: 1 }}>
        {media?.isVideo ? (
          <>
            <Pressable
              onPress={onClose}
              style={{
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.58)",
                borderRadius: 18,
                height: 36,
                justifyContent: "center",
                position: "absolute",
                right: 14,
                top: 48,
                width: 36,
                zIndex: 6,
              }}
            >
              <Ionicons name="close-outline" size={24} color={COLORS.TEXT_WHITE} />
            </Pressable>
            {videoChromeVisible ? (
              <View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.42)",
                  borderRadius: 8,
                  left: 14,
                  maxWidth: "72%",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  position: "absolute",
                  top: 50,
                  zIndex: 5,
                }}
              >
                <Text numberOfLines={1} style={{ color: COLORS.TEXT_WHITE, fontSize: 14, fontWeight: "900" }}>
                  {media.title || "Progress video"}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <ViewerHeader media={media} onClose={onClose} />
        )}

        <View
          onTouchStart={() => {
            if (media?.isVideo) setVideoChromeVisible(true);
          }}
          style={{ flex: 1, justifyContent: "center" }}
        >
          {media?.isVideo ? (
            <VideoView
              player={player}
              contentFit="contain"
              fullscreenOptions={{ enable: true }}
              allowsPictureInPicture
              nativeControls
              playsInline
              style={{ backgroundColor: "#000000", flex: 1, width: "100%" }}
            />
          ) : media ? (
            <GestureDetector gesture={imageGesture}>
              <Animated.View style={[{ height: "100%", width: "100%" }, imageStyle]}>
                <Image
                  source={{ uri: media.url }}
                  contentFit="contain"
                  enableLiveTextInteraction
                  allowDownscaling={false}
                  style={{ height: "100%", width: "100%" }}
                />
              </Animated.View>
            </GestureDetector>
          ) : null}
        </View>

        {!media?.isVideo ? (
          <View style={{ alignItems: "center", paddingBottom: 28, paddingHorizontal: 16 }}>
            <Text style={{ color: "#CBD5E1", fontSize: 12, textAlign: "center" }}>Pinch to zoom. Drag to inspect when zoomed.</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function ViewerHeader({ media, onClose }: { media: ProgressMedia | null; onClose: () => void }) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 }}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: COLORS.TEXT_WHITE, fontSize: 16, fontWeight: "900" }}>
          {media?.title || "Progress photo"}
        </Text>
        {media?.caption ? (
          <Text numberOfLines={1} style={{ color: "#CBD5E1", fontSize: 12, marginTop: 3 }}>
            {media.caption}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onClose}
        style={{ alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10, height: 42, justifyContent: "center", width: 42 }}
      >
        <Ionicons name="close-outline" size={26} color={COLORS.TEXT_WHITE} />
      </Pressable>
    </View>
  );
}
