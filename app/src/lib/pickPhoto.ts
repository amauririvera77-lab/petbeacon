import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS, Alert, Platform } from "react-native";

// Elige una foto: cámara o galería. quality 0.7 la mantiene liviana para subirla a Storage.
export async function pickPhoto(source: "camera" | "library"): Promise<string | null> {
  const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "photo"} access in Settings to add a photo, or skip this step.`);
    return null;
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [4, 3] };
  const res = source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  return !res.canceled && res.assets[0] ? res.assets[0].uri : null;
}

// Menú "Take photo / Choose from library" (hoja nativa en iOS, diálogo en Android).
export function choosePhotoSource(onPick: (source: "camera" | "library") => void) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ["Take photo", "Choose from library", "Cancel"], cancelButtonIndex: 2 },
      (i) => { if (i === 0) onPick("camera"); else if (i === 1) onPick("library"); },
    );
  } else {
    Alert.alert("Add a photo", undefined, [
      { text: "Take photo", onPress: () => onPick("camera") },
      { text: "Choose from library", onPress: () => onPick("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }
}
